import json
import logging
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

sentiment_router = APIRouter()

# Load JSON data
def load_demo_data():
    with open('demo_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Convert date strings to datetime
    for review in data.get('sentimental_analysis', []):
        if isinstance(review.get('time_period'), str):
            review['time_period'] = datetime.fromisoformat(review['time_period'].replace('Z', '+00:00'))

    for report in data.get('sentimental_monthly_reports', []):
        if isinstance(report.get('time_period'), str):
            report['time_period'] = datetime.fromisoformat(report['time_period'].replace('Z', '+00:00'))

    return data

DEMO_DATA = load_demo_data()

# Load email data
def load_email_data():
    with open('email-demo.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Convert timestamp strings to datetime
    for email in data.get('emails', []):
        if isinstance(email.get('timestamp'), str):
            email['timestamp'] = datetime.fromisoformat(email['timestamp'].replace('Z', '+00:00'))

    return data

EMAIL_DATA = load_email_data()

# Helper functions
def filter_reviews(platform=None, company=None, start_date=None, end_date=None, sentiment=None):
    reviews = DEMO_DATA['sentimental_analysis']
    filtered = []

    for review in reviews:
        if platform and review.get('platform') != platform:
            continue
        if company and review.get('company') != company:
            continue
        if sentiment and review.get('overall_sentiment') != sentiment:
            continue
        if start_date and review.get('time_period') < datetime.fromisoformat(start_date):
            continue
        if end_date and review.get('time_period') > datetime.fromisoformat(end_date):
            continue
        filtered.append(review)

    return filtered

def humanize_snake_case(value: str) -> str:
    return value.replace("_", " ").title()

# Pydantic Models
class OverallReport(BaseModel):
    overall_sentiment: dict
    total_reviews: int
    last_updated: datetime
    sentiment_counts: Dict[str, int] = {}

class TrendReport(BaseModel):
    trends: list

# Routes
@sentiment_router.get("/companies")
async def get_available_companies():
    companies = set()
    for review in DEMO_DATA['sentimental_analysis']:
        if review.get('company'):
            companies.add(review['company'])

    excluded = ["cook_and_pan"]
    valid_companies = [
        {"value": c, "display": c.replace("_", " ").title()}
        for c in companies if c not in excluded
    ]
    valid_companies.sort(key=lambda x: x["display"])

    return {"companies": valid_companies}

@sentiment_router.get("/report/overall_by_platform", response_model=OverallReport)
async def overall_by_platform(
    platform: str = Query(None),
    days: Optional[int] = Query(None),
    company: str = Query(None)
):
    start_date = None
    end_date = None
    if days:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        start_date = start_date.isoformat()
        end_date = end_date.isoformat()

    reviews = filter_reviews(platform, company, start_date, end_date)

    if not reviews:
        raise HTTPException(status_code=404, detail="No review data found")

    total = len(reviews)
    sentiment_counts = defaultdict(int)

    for review in reviews:
        sentiment = review.get('overall_sentiment')
        if sentiment:
            sentiment_counts[sentiment] += 1

    overall_sentiment = {
        sentiment: round((count / total) * 100, 2)
        for sentiment, count in sentiment_counts.items()
    }

    last_updated = max(r['time_period'] for r in reviews if r.get('time_period'))

    return {
        "overall_sentiment": overall_sentiment,
        "total_reviews": total,
        "last_updated": last_updated,
        "sentiment_counts": dict(sentiment_counts)
    }

@sentiment_router.get("/report/trends", response_model=TrendReport)
async def report_trends(
    platform: str = Query(None),
    days: Optional[int] = Query(None),
    company: str = Query(None)
):
    start_date = None
    end_date = None
    if days:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        start_date = start_date.isoformat()
        end_date = end_date.isoformat()

    reviews = filter_reviews(platform, company, start_date, end_date)

    monthly_data = defaultdict(lambda: {"positive": 0, "negative": 0, "neutral": 0})

    for review in reviews:
        if review.get('time_period') and review.get('overall_sentiment'):
            month = review['time_period'].strftime("%Y-%m")
            sentiment = review['overall_sentiment']
            if sentiment in ['positive', 'negative', 'neutral']:
                monthly_data[month][sentiment] += 1

    trends = [
        {"month": month, **counts}
        for month, counts in sorted(monthly_data.items())
    ]

    return {"trends": trends}

@sentiment_router.get("/report/monthly_feedback")
async def monthly_feedback(
    platform: Optional[str] = None,
    days: Optional[int] = None,
    company: Optional[str] = None
):
    start_date = None
    end_date = None
    if days:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        start_date = start_date.isoformat()
        end_date = end_date.isoformat()

    reviews = filter_reviews(platform, company, start_date, end_date)

    monthly_data = defaultdict(lambda: {"positive": [], "negative": []})

    for review in reviews:
        if not review.get('time_period'):
            continue

        month = review['time_period'].strftime("%Y-%m")
        sentiment = review.get('overall_sentiment')
        category = review.get('overall_sentimental_category', '')

        if sentiment in ['positive', 'negative'] and category:
            monthly_data[month][sentiment].append({
                "category": humanize_snake_case(category),
                "count": 1
            })

    output = []
    for month in sorted(monthly_data.keys()):
        data = monthly_data[month]

        pos_counts = defaultdict(int)
        neg_counts = defaultdict(int)

        for item in data['positive']:
            pos_counts[item['category']] += 1
        for item in data['negative']:
            neg_counts[item['category']] += 1

        top_pos = sorted([{"category": k, "count": v, "sentiment": "positive"}
                         for k, v in pos_counts.items()],
                        key=lambda x: x['count'], reverse=True)[:3]
        top_neg = sorted([{"category": k, "count": v, "sentiment": "negative"}
                         for k, v in neg_counts.items()],
                        key=lambda x: x['count'], reverse=True)[:3]

        output.append({
            "month": month,
            "top_positive": top_pos,
            "top_negative": top_neg
        })

    return {"data": output}

@sentiment_router.get("/reviews")
async def get_reviews(
    sentiment: str = Query(None),
    platform: str = Query(None),
    skip: int = Query(0),
    limit: int = Query(20),
    company: str = Query(None)
):
    reviews = filter_reviews(platform, company, sentiment=sentiment)

    paginated = reviews[skip:skip+limit]

    for review in paginated:
        if isinstance(review.get('time_period'), datetime):
            review['time_period'] = review['time_period'].isoformat()

    return {"reviews": paginated}

@sentiment_router.get("/report/available_months")
async def get_available_months(company: str = Query(...)):
    reports = [r for r in DEMO_DATA['sentimental_monthly_reports']
               if r.get('company') == company]

    available_months = []
    for report in reports:
        if isinstance(report['time_period'], datetime):
            year = report['time_period'].year
            month = report['time_period'].month
            month_str = f"{year}-{month:02d}"
            available_months.append({
                "value": month_str,
                "label": month_str,
                "year": year,
                "month": month
            })

    available_months.sort(key=lambda x: x['value'], reverse=True)
    return {"available_months": available_months[:12]}

@sentiment_router.get("/report/monthly_analysis")
async def get_monthly_analysis(
    company: str = Query(...),
    year: int = Query(...),
    month: int = Query(...)
):
    for report in DEMO_DATA['sentimental_monthly_reports']:
        if (report.get('company') == company and
            isinstance(report['time_period'], datetime) and
            report['time_period'].year == year and
            report['time_period'].month == month):

            result = dict(report)
            if isinstance(result.get('time_period'), datetime):
                result['time_period'] = result['time_period'].isoformat()
            return result

    raise HTTPException(status_code=404, detail=f"No data found for {company} in {year}-{month:02d}")

@sentiment_router.get("/shopify_insights")
async def get_shopify_insights():
    data = DEMO_DATA.get('shopify_insights_lifetime')
    if not data:
        raise HTTPException(status_code=404, detail="Data not found")

    return {
        "company": data.get("company"),
        "total_gross_sales": data.get("total_gross_sales"),
        "total_customers": data.get("total_customers"),
        "total_orders": data.get("total_orders"),
        "best_selling_products": data.get("best_selling_products"),
    }

@sentiment_router.get("/report/category_table")
async def category_table_pros_cons(
    platform: str = Query(None),
    sentiment: str = Query(None),
    limit: int = Query(10),
    start_date: str = Query(None),
    end_date: str = Query(None),
    company: str = Query(None)
):
    reviews = filter_reviews(platform, company, start_date, end_date, sentiment)

    category_counts = defaultdict(int)
    for review in reviews:
        category = review.get('category')
        if category:
            category_counts[category] += 1

    table = sorted([{"category": k, "count": v} for k, v in category_counts.items()],
                   key=lambda x: x['count'], reverse=True)[:limit]

    return {"table": table}

@sentiment_router.get("/report/overall_detail")
async def overall_detail(
    platform: str = Query(None),
    days: Optional[int] = Query(None),
    company: str = Query(None)
):
    start_date = None
    end_date = None
    if days:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        start_date = start_date.isoformat()
        end_date = end_date.isoformat()

    reviews = filter_reviews(platform, company, start_date, end_date)

    if not reviews:
        raise HTTPException(status_code=404, detail="No review data found for sentiment detail")

    total = len(reviews)
    detail_counts = defaultdict(int)

    for review in reviews:
        detail = review.get('overall_sentiment_detail')
        if detail:
            detail_counts[detail] += 1

    detail_distribution = {}
    for detail_name, count in detail_counts.items():
        percentage = round((count / total) * 100, 2)
        if percentage >= 1.0:
            detail_distribution[detail_name] = {"count": count, "percentage": percentage}

    last_updated = max(r['time_period'] for r in reviews if r.get('time_period'))

    return {
        "overall_sentiment_detail": detail_distribution,
        "total_reviews": total,
        "last_updated": last_updated
    }

@sentiment_router.get("/emails")
async def get_emails():
    """Get all emails with AI replies"""
    emails = EMAIL_DATA.get('emails', [])

    # Convert datetime back to ISO string for JSON response
    emails_response = []
    for email in emails:
        email_copy = dict(email)
        if isinstance(email_copy.get('timestamp'), datetime):
            email_copy['timestamp'] = email_copy['timestamp'].isoformat()
        emails_response.append(email_copy)

    return {
        "emails": emails_response,
        "email_statistics": EMAIL_DATA.get('email_statistics', {})
    }
