import json
import logging
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ecom_agent_router = APIRouter()

# OpenAI API key and base URL for Emergent integration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "sk-emergent-e6cC403A7332fC34cA")
# Use Emergent's integration proxy
INTEGRATION_PROXY_URL = os.getenv("INTEGRATION_PROXY_URL", "https://integrations.emergentagent.com")

# Initialize LangChain LLM with Emergent proxy
llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.3,
    api_key=OPENAI_API_KEY,
    base_url=f"{INTEGRATION_PROXY_URL}/openai/v1"
)

# Load all data sources
def load_all_data_sources():
    """Load all JSON data sources for the e-commerce agent"""
    data_sources = {}
    
    try:
        with open('product.json', 'r') as f:
            data_sources['products'] = json.load(f)
        
        with open('shopify_demo.json', 'r') as f:
            data_sources['shopify'] = json.load(f)
        
        with open('dhl_demo.json', 'r') as f:
            data_sources['dhl'] = json.load(f)
        
        with open('strategies.json', 'r') as f:
            data_sources['strategies'] = json.load(f)
        
        with open('meta_ads.json', 'r') as f:
            data_sources['meta_ads'] = json.load(f)
        
        with open('google_ads.json', 'r') as f:
            data_sources['google_ads'] = json.load(f)
        
        return data_sources
    except Exception as e:
        logger.error(f"Error loading data sources: {e}")
        return {}

# Pydantic models
class EcomChatMessage(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = []

class KnowledgeBaseUpdate(BaseModel):
    content: str

# In-memory storage for e-commerce agent config
ecom_config = {
    "knowledge_base": """Welcome to Saturnin E-commerce AI Agent!

I can help you with:
- Product catalog and inventory information
- Order tracking and management (Shopify integration)
- Shipping and delivery tracking (DHL integration)
- Marketing strategies and campaign planning
- Meta Ads (Facebook/Instagram) performance analysis
- Google Ads campaign insights and optimization
- E-commerce business intelligence and recommendations

I have access to real-time data from all your connected systems and can provide actionable insights to grow your business."""
}

def create_context_from_query(query: str, data_sources: dict) -> tuple[str, List[str]]:
    """
    Analyze query and fetch relevant data from appropriate sources
    Returns: (context_string, list_of_sources_used)
    """
    query_lower = query.lower()
    context_parts = []
    sources_used = []
    
    # Check for product queries
    if any(word in query_lower for word in ['product', 'inventory', 'stock', 'price', 'item', 'catalog']):
        products = data_sources.get('products', {}).get('products', [])
        context_parts.append(f"PRODUCT CATALOG ({len(products)} products):\n{json.dumps(products[:5], indent=2)}")
        sources_used.append("product.json")
    
    # Check for order/shopify queries
    if any(word in query_lower for word in ['order', 'purchase', 'shopify', 'customer', 'ord-']):
        orders = data_sources.get('shopify', {}).get('orders', [])
        context_parts.append(f"SHOPIFY ORDERS ({len(orders)} orders):\n{json.dumps(orders, indent=2)}")
        sources_used.append("shopify_demo.json")
    
    # Check for shipping/tracking queries
    if any(word in query_lower for word in ['ship', 'delivery', 'track', 'dhl', 'dhl-']):
        shipments = data_sources.get('dhl', {}).get('shipments', [])
        context_parts.append(f"DHL TRACKING ({len(shipments)} shipments):\n{json.dumps(shipments, indent=2)}")
        sources_used.append("dhl_demo.json")
    
    # Check for strategy queries
    if any(word in query_lower for word in ['strategy', 'marketing', 'campaign', 'plan', 'tactic', 'goal']):
        strategies = data_sources.get('strategies', {}).get('strategies', [])
        context_parts.append(f"MARKETING STRATEGIES ({len(strategies)} strategies):\n{json.dumps(strategies, indent=2)}")
        sources_used.append("strategies.json")
    
    # Check for Meta Ads queries
    if any(word in query_lower for word in ['meta', 'facebook', 'instagram', 'social', 'meta-']):
        meta_ads = data_sources.get('meta_ads', {})
        campaigns = meta_ads.get('campaigns', [])
        overall = meta_ads.get('overall_performance', {})
        context_parts.append(f"META ADS CAMPAIGNS ({len(campaigns)} campaigns):\n{json.dumps(campaigns, indent=2)}\n\nOVERALL PERFORMANCE:\n{json.dumps(overall, indent=2)}")
        sources_used.append("meta_ads.json")
    
    # Check for Google Ads queries
    if any(word in query_lower for word in ['google', 'search', 'ppc', 'adwords', 'google-']):
        google_ads = data_sources.get('google_ads', {})
        campaigns = google_ads.get('campaigns', [])
        overall = google_ads.get('overall_performance', {})
        context_parts.append(f"GOOGLE ADS CAMPAIGNS ({len(campaigns)} campaigns):\n{json.dumps(campaigns, indent=2)}\n\nOVERALL PERFORMANCE:\n{json.dumps(overall, indent=2)}")
        sources_used.append("google_ads.json")
    
    # Check for performance/analytics queries
    if any(word in query_lower for word in ['performance', 'roi', 'roas', 'revenue', 'sales', 'conversion', 'analytics']):
        if 'meta_ads.json' not in sources_used:
            meta_overall = data_sources.get('meta_ads', {}).get('overall_performance', {})
            context_parts.append(f"META ADS PERFORMANCE:\n{json.dumps(meta_overall, indent=2)}")
            sources_used.append("meta_ads.json")
        
        if 'google_ads.json' not in sources_used:
            google_overall = data_sources.get('google_ads', {}).get('overall_performance', {})
            context_parts.append(f"GOOGLE ADS PERFORMANCE:\n{json.dumps(google_overall, indent=2)}")
            sources_used.append("google_ads.json")
    
    # If no specific data found, provide knowledge base
    if not context_parts:
        context_parts.append(f"KNOWLEDGE BASE:\n{ecom_config['knowledge_base']}")
        sources_used.append("knowledge_base")
    
    return "\n\n---\n\n".join(context_parts), sources_used

@ecom_agent_router.get("/ecom-agent/knowledge-base")
async def get_ecom_knowledge_base():
    """Get e-commerce agent knowledge base"""
    return {"knowledge_base": ecom_config["knowledge_base"]}

@ecom_agent_router.post("/ecom-agent/knowledge-base")
async def update_ecom_knowledge_base(data: KnowledgeBaseUpdate):
    """Update e-commerce agent knowledge base"""
    ecom_config["knowledge_base"] = data.content
    return {"success": True, "message": "Knowledge base updated"}

@ecom_agent_router.get("/ecom-agent/connectors")
async def get_ecom_connectors():
    """Get status of all e-commerce connectors"""
    try:
        data_sources = load_all_data_sources()
        
        connectors = [
            {
                "name": "Product Catalog",
                "type": "product.json",
                "status": "connected",
                "records": len(data_sources.get('products', {}).get('products', [])),
                "description": "Product inventory, prices, and details"
            },
            {
                "name": "Shopify Orders",
                "type": "shopify_demo.json",
                "status": "connected",
                "records": len(data_sources.get('shopify', {}).get('orders', [])),
                "description": "Customer orders and purchase history"
            },
            {
                "name": "DHL Tracking",
                "type": "dhl_demo.json",
                "status": "connected",
                "records": len(data_sources.get('dhl', {}).get('shipments', [])),
                "description": "Shipment tracking and delivery status"
            },
            {
                "name": "Marketing Strategies",
                "type": "strategies.json",
                "status": "connected",
                "records": len(data_sources.get('strategies', {}).get('strategies', [])),
                "description": "Marketing plans and campaign strategies"
            },
            {
                "name": "Meta Ads",
                "type": "meta_ads.json",
                "status": "connected",
                "records": len(data_sources.get('meta_ads', {}).get('campaigns', [])),
                "description": "Facebook & Instagram ad campaigns"
            },
            {
                "name": "Google Ads",
                "type": "google_ads.json",
                "status": "connected",
                "records": len(data_sources.get('google_ads', {}).get('campaigns', [])),
                "description": "Google Ads campaigns and performance"
            }
        ]
        
        return {"connectors": connectors}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching connectors: {str(e)}")

@ecom_agent_router.post("/ecom-agent/chat")
async def chat_with_ecom_agent(chat: EcomChatMessage):
    """
    Chat with e-commerce AI agent powered by GPT-4o-mini and LangChain
    Includes citations showing which data sources were used
    """
    try:
        # Load all data sources
        data_sources = load_all_data_sources()
        
        # Create context from query
        context, sources_used = create_context_from_query(chat.message, data_sources)
        
        # Create LangChain prompt template
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", """You are an expert E-commerce AI Assistant for Saturnin.

You have access to real-time data from multiple sources:
- Product catalog
- Shopify orders
- DHL shipping tracking
- Marketing strategies
- Meta Ads (Facebook/Instagram) campaigns
- Google Ads campaigns

Your role:
1. Analyze the provided data carefully
2. Answer questions with specific numbers, dates, and details
3. Provide actionable insights and recommendations
4. Be concise but comprehensive
5. Always cite specific data points when making statements

Context from connected data sources:
{context}

Remember: Always base your answers on the actual data provided above."""),
            ("human", "{question}")
        ])
        
        # Create chain
        chain = (
            {"context": lambda x: context, "question": lambda x: x["question"]}
            | prompt_template
            | llm
            | StrOutputParser()
        )
        
        # Get response from LLM
        response = await chain.ainvoke({"question": chat.message})
        
        # Add citation information
        citation_text = "\n\n📚 **Sources Used:**\n" + "\n".join([f"- {source}" for source in sources_used])
        
        return {
            "response": response + citation_text,
            "sources": sources_used,
            "model": "gpt-4o-mini",
            "data_context_size": len(context)
        }
        
    except Exception as e:
        logger.error(f"E-commerce agent error: {e}")
        return {
            "response": f"I apologize, but I encountered an error processing your request: {str(e)}. Please try again or rephrase your question.",
            "sources": [],
            "error": str(e)
        }

@ecom_agent_router.get("/ecom-agent/analytics")
async def get_ecom_analytics():
    """Get comprehensive e-commerce analytics"""
    try:
        data_sources = load_all_data_sources()
        
        # Calculate analytics
        products = data_sources.get('products', {}).get('products', [])
        orders = data_sources.get('shopify', {}).get('orders', [])
        meta_perf = data_sources.get('meta_ads', {}).get('overall_performance', {})
        google_perf = data_sources.get('google_ads', {}).get('overall_performance', {})
        
        total_revenue = sum(order.get('total', 0) for order in orders)
        total_orders = len(orders)
        avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
        
        total_ad_spend = meta_perf.get('total_spend', 0) + google_perf.get('total_spend', 0)
        total_ad_revenue = meta_perf.get('total_revenue', 0) + google_perf.get('total_revenue', 0)
        overall_roas = total_ad_revenue / total_ad_spend if total_ad_spend > 0 else 0
        
        return {
            "summary": {
                "total_products": len(products),
                "total_orders": total_orders,
                "total_revenue": round(total_revenue, 2),
                "avg_order_value": round(avg_order_value, 2),
                "total_ad_spend": total_ad_spend,
                "total_ad_revenue": total_ad_revenue,
                "overall_roas": round(overall_roas, 2)
            },
            "meta_ads": meta_perf,
            "google_ads": google_perf
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating analytics: {str(e)}")
