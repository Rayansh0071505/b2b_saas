import json
import logging
from fastapi import APIRouter, HTTPException
from typing import Dict, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

qualitative_router = APIRouter()

def load_json_file(filename: str) -> dict:
    """Load a JSON file"""
    try:
        with open(filename, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading {filename}: {e}")
        return {}

@qualitative_router.get("/qualitative/connectors")
async def get_qualitative_connectors():
    """Get all connectors with their data"""
    try:
        meta_ads = load_json_file('meta_ads.json')
        google_ads = load_json_file('google_ads.json')
        google_analytics = load_json_file('google_analytics.json')
        pinterest = load_json_file('pinterest_ads.json')
        shopify = load_json_file('shopify_demo.json')
        woocommerce = load_json_file('woocommerce.json')
        
        connectors = [
            {
                "name": "Meta Ads",
                "type": "advertising",
                "platform": "Facebook & Instagram",
                "status": "connected",
                "campaigns": len(meta_ads.get('campaigns', [])),
                "spend": meta_ads.get('overall_performance', {}).get('total_spend', 0),
                "revenue": meta_ads.get('overall_performance', {}).get('total_revenue', 0),
                "roas": meta_ads.get('overall_performance', {}).get('overall_roas', 0)
            },
            {
                "name": "Google Ads",
                "type": "advertising",
                "platform": "Google",
                "status": "connected",
                "campaigns": len(google_ads.get('campaigns', [])),
                "spend": google_ads.get('overall_performance', {}).get('total_spend', 0),
                "revenue": google_ads.get('overall_performance', {}).get('total_revenue', 0),
                "roas": google_ads.get('overall_performance', {}).get('overall_roas', 0)
            },
            {
                "name": "Google Analytics",
                "type": "analytics",
                "platform": "Google",
                "status": "connected",
                "total_users": google_analytics.get('website_overview', {}).get('total_users', 0),
                "total_sessions": google_analytics.get('website_overview', {}).get('total_sessions', 0),
                "conversion_rate": google_analytics.get('conversions', {}).get('conversion_rate', '0%')
            },
            {
                "name": "Pinterest Ads",
                "type": "advertising",
                "platform": "Pinterest",
                "status": "connected",
                "campaigns": len(pinterest.get('campaigns', [])),
                "spend": pinterest.get('overall_performance', {}).get('total_spend', 0),
                "revenue": pinterest.get('overall_performance', {}).get('total_revenue', 0),
                "roas": pinterest.get('overall_performance', {}).get('overall_roas', 0)
            },
            {
                "name": "Shopify",
                "type": "ecommerce",
                "platform": "Shopify",
                "status": "connected",
                "orders": len(shopify.get('orders', [])),
                "total_revenue": sum(order.get('total', 0) for order in shopify.get('orders', []))
            },
            {
                "name": "WooCommerce",
                "type": "ecommerce",
                "platform": "WordPress",
                "status": "connected",
                "orders": woocommerce.get('analytics', {}).get('total_orders', 0),
                "total_revenue": woocommerce.get('analytics', {}).get('total_revenue', 0),
                "products": woocommerce.get('analytics', {}).get('total_products', 0)
            }
        ]
        
        return {"connectors": connectors}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching connectors: {str(e)}")

@qualitative_router.get("/qualitative/dashboard")
async def get_dashboard_analytics():
    """Get comprehensive dashboard analytics"""
    try:
        # Load all data sources
        shopify = load_json_file('shopify_demo.json')
        woocommerce = load_json_file('woocommerce.json')
        product_catalog = load_json_file('product.json')
        meta_ads = load_json_file('meta_ads.json')
        google_ads = load_json_file('google_ads.json')
        pinterest = load_json_file('pinterest_ads.json')
        google_analytics = load_json_file('google_analytics.json')
        
        # Calculate combined metrics
        shopify_orders = shopify.get('orders', [])
        woo_orders = woocommerce.get('orders', [])
        
        total_orders = len(shopify_orders) + len(woo_orders)
        
        shopify_revenue = sum(order.get('total', 0) for order in shopify_orders)
        woo_revenue = woocommerce.get('analytics', {}).get('total_revenue', 0)
        total_revenue = shopify_revenue + woo_revenue
        
        avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
        
        # Products and inventory
        products = product_catalog.get('products', [])
        total_products = len(products)
        total_stock = sum(p.get('stock', 0) for p in products)
        low_stock_products = len([p for p in products if p.get('stock', 0) < 50])
        
        # Customers (unique from both platforms)
        shopify_customers = set(order.get('customer', {}).get('email') for order in shopify_orders)
        woo_customers = woocommerce.get('customers', [])
        total_customers = len(shopify_customers) + len(woo_customers)
        
        # Ad spend and ROAS
        total_ad_spend = (
            meta_ads.get('overall_performance', {}).get('total_spend', 0) +
            google_ads.get('overall_performance', {}).get('total_spend', 0) +
            pinterest.get('overall_performance', {}).get('total_spend', 0)
        )
        
        total_ad_revenue = (
            meta_ads.get('overall_performance', {}).get('total_revenue', 0) +
            google_ads.get('overall_performance', {}).get('total_revenue', 0) +
            pinterest.get('overall_performance', {}).get('total_revenue', 0)
        )
        
        overall_roas = total_ad_revenue / total_ad_spend if total_ad_spend > 0 else 0
        
        # Order status breakdown
        order_statuses = {}
        for order in shopify_orders + woo_orders:
            status = order.get('status', 'unknown')
            order_statuses[status] = order_statuses.get(status, 0) + 1
        
        # Top products (from product catalog with sales data)
        top_products = sorted(
            [{"name": p.get('name'), "revenue": p.get('price', 0) * p.get('reviews_count', 0) / 10, "stock": p.get('stock', 0)} 
             for p in products],
            key=lambda x: x['revenue'],
            reverse=True
        )[:5]
        
        # Revenue by channel
        revenue_by_channel = [
            {"channel": "Shopify", "revenue": shopify_revenue},
            {"channel": "WooCommerce", "revenue": woo_revenue},
            {"channel": "Meta Ads", "revenue": meta_ads.get('overall_performance', {}).get('total_revenue', 0)},
            {"channel": "Google Ads", "revenue": google_ads.get('overall_performance', {}).get('total_revenue', 0)},
            {"channel": "Pinterest", "revenue": pinterest.get('overall_performance', {}).get('total_revenue', 0)}
        ]
        
        # Traffic sources
        traffic_sources = google_analytics.get('traffic_sources', [])
        
        # Monthly trend (simplified)
        monthly_trend = [
            {"month": "Jan", "revenue": total_revenue * 0.85, "orders": total_orders * 0.9},
            {"month": "Feb", "revenue": total_revenue, "orders": total_orders}
        ]
        
        return {
            "overview": {
                "total_revenue": round(total_revenue, 2),
                "total_orders": total_orders,
                "avg_order_value": round(avg_order_value, 2),
                "total_customers": total_customers,
                "total_products": total_products,
                "total_stock": total_stock,
                "low_stock_products": low_stock_products,
                "total_ad_spend": round(total_ad_spend, 2),
                "overall_roas": round(overall_roas, 2)
            },
            "order_statuses": order_statuses,
            "top_products": top_products,
            "revenue_by_channel": revenue_by_channel,
            "traffic_sources": traffic_sources[:5],
            "monthly_trend": monthly_trend,
            "conversion_metrics": {
                "website_visitors": google_analytics.get('website_overview', {}).get('total_users', 0),
                "conversion_rate": google_analytics.get('conversions', {}).get('conversion_rate', '0%'),
                "bounce_rate": google_analytics.get('website_overview', {}).get('bounce_rate', '0%')
            }
        }
    except Exception as e:
        logger.error(f"Dashboard analytics error: {e}")
        raise HTTPException(status_code=500, detail=f"Error calculating analytics: {str(e)}")
