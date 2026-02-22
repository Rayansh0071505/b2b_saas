import json
import logging
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bot_router = APIRouter()

# In-memory storage for bot configuration (in production, use database)
bot_config = {
    "knowledge_base": """Welcome to Saturnin Support! We're here to help you with:
- Order tracking and status updates
- Product information and availability
- Shipping information via DHL
- General customer support

Our business hours: Monday-Friday, 9 AM - 6 PM EST
Email: support@saturnin.com
Phone: 1-800-SATURNIN""",
    "bot_instructions": """You are a helpful and friendly customer support AI for Saturnin. 

Guidelines:
1. Always be polite, professional, and empathetic
2. Greet customers warmly and thank them for contacting Saturnin
3. When providing order information, include all relevant details (order number, status, items, total)
4. For tracking inquiries, provide current status and estimated delivery date
5. If you don't have information, apologize and offer to escalate to a human agent
6. Keep responses concise but complete
7. Always end with asking if there's anything else you can help with

Tone: Friendly, professional, helpful
Response length: 2-3 sentences for simple queries, more for complex ones
"""
}

# Load connector data
def load_products():
    with open('product.json', 'r') as f:
        return json.load(f)

def load_shopify_orders():
    with open('shopify_demo.json', 'r') as f:
        return json.load(f)

def load_dhl_tracking():
    with open('dhl_demo.json', 'r') as f:
        return json.load(f)

# Pydantic models
class KnowledgeBaseUpdate(BaseModel):
    content: str

class BotInstructionsUpdate(BaseModel):
    instructions: str

class ChatMessage(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = []

# Bot configuration endpoints
@bot_router.get("/bot/knowledge-base")
async def get_knowledge_base():
    return {"knowledge_base": bot_config["knowledge_base"]}

@bot_router.post("/bot/knowledge-base")
async def update_knowledge_base(data: KnowledgeBaseUpdate):
    bot_config["knowledge_base"] = data.content
    return {"success": True, "message": "Knowledge base updated"}

@bot_router.get("/bot/instructions")
async def get_bot_instructions():
    return {"instructions": bot_config["bot_instructions"]}

@bot_router.post("/bot/instructions")
async def update_bot_instructions(data: BotInstructionsUpdate):
    bot_config["bot_instructions"] = data.instructions
    return {"success": True, "message": "Bot instructions updated"}

# Connector endpoints
@bot_router.get("/bot/connectors/products")
async def get_products(
    product_id: Optional[str] = None,
    search: Optional[str] = None
):
    """Get product information"""
    products_data = load_products()
    products = products_data["products"]
    
    if product_id:
        product = next((p for p in products if p["id"] == product_id), None)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"product": product}
    
    if search:
        search_lower = search.lower()
        filtered = [p for p in products if 
                   search_lower in p["name"].lower() or 
                   search_lower in p["category"].lower() or
                   search_lower in p["description"].lower()]
        return {"products": filtered, "count": len(filtered)}
    
    return {"products": products, "count": len(products)}

@bot_router.get("/bot/connectors/shopify/order/{order_number}")
async def get_shopify_order(order_number: str):
    """Get Shopify order details by order number"""
    orders_data = load_shopify_orders()
    order = next((o for o in orders_data["orders"] if o["order_number"] == order_number), None)
    
    if not order:
        raise HTTPException(status_code=404, detail=f"Order {order_number} not found")
    
    return {"order": order}

@bot_router.get("/bot/connectors/dhl/tracking/{tracking_number}")
async def get_dhl_tracking(tracking_number: str):
    """Get DHL tracking information"""
    tracking_data = load_dhl_tracking()
    shipment = next((s for s in tracking_data["shipments"] if s["tracking_number"] == tracking_number), None)
    
    if not shipment:
        raise HTTPException(status_code=404, detail=f"Tracking number {tracking_number} not found")
    
    return {"shipment": shipment}

# AI Chatbot endpoint
@bot_router.post("/bot/chat")
async def chat_with_bot(chat: ChatMessage):
    """AI chatbot that uses connectors to answer questions"""
    message = chat.message.lower()
    
    try:
        # Simple AI logic to route queries (in production, use actual AI/LLM)
        
        # Check for order number pattern
        if "ord-" in message or "order" in message:
            # Extract order number
            words = chat.message.split()
            order_num = next((w for w in words if w.upper().startswith("ORD-")), None)
            
            if order_num:
                try:
                    orders_data = load_shopify_orders()
                    order = next((o for o in orders_data["orders"] if o["order_number"].upper() == order_num.upper()), None)
                    
                    if order:
                        items_str = ", ".join([f"{item['product_name']} (x{item['quantity']})" for item in order['items']])
                        response = f"""Hello! I found your order {order['order_number']} 📦

**Status:** {order['status'].replace('_', ' ').title()}
**Order Date:** {order['order_date'][:10]}
**Items:** {items_str}
**Total:** ${order['total']} {order['currency']}

"""
                        if order['tracking_number']:
                            response += f"**Tracking:** {order['tracking_number']}\n"
                            # Get tracking info
                            tracking_data = load_dhl_tracking()
                            shipment = next((s for s in tracking_data["shipments"] if s["tracking_number"] == order['tracking_number']), None)
                            if shipment:
                                response += f"**Shipping Status:** {shipment['status'].replace('_', ' ').title()}\n"
                                if shipment['estimated_delivery']:
                                    response += f"**Estimated Delivery:** {shipment['estimated_delivery'][:10]}\n"
                        
                        response += "\nIs there anything else I can help you with?"
                        return {
                            "response": response,
                            "data_source": "shopify_connector",
                            "order_number": order_num
                        }
                except Exception as e:
                    logger.error(f"Error fetching order: {e}")
        
        # Check for tracking number
        if "dhl-" in message or "track" in message:
            words = chat.message.split()
            tracking_num = next((w for w in words if w.upper().startswith("DHL-")), None)
            
            if tracking_num:
                try:
                    tracking_data = load_dhl_tracking()
                    shipment = next((s for s in tracking_data["shipments"] if s["tracking_number"].upper() == tracking_num.upper()), None)
                    
                    if shipment:
                        response = f"""📦 Tracking Information for {tracking_num}

**Status:** {shipment['status'].replace('_', ' ').title()}
**Service:** {shipment['service_type']}
**From:** {shipment['origin']['city']}, {shipment['origin']['state']}
**To:** {shipment['destination']['city']}, {shipment['destination']['state']}
**Shipped:** {shipment['shipped_date'][:10]}
**Estimated Delivery:** {shipment['estimated_delivery'][:10] if shipment['estimated_delivery'] else 'N/A'}

**Latest Update:**
"""
                        if shipment['events']:
                            latest = shipment['events'][-1]
                            response += f"{latest['timestamp'][:10]} - {latest['description']} ({latest['location']})\n"
                        
                        response += "\nWould you like more details about this shipment?"
                        return {
                            "response": response,
                            "data_source": "dhl_connector",
                            "tracking_number": tracking_num
                        }
                except Exception as e:
                    logger.error(f"Error fetching tracking: {e}")
        
        # Check for product queries
        if any(word in message for word in ["product", "headphone", "watch", "chair", "webcam", "tea", "charger", "price", "buy"]):
            try:
                products_data = load_products()
                
                # Simple keyword matching
                search_terms = message.split()
                matching_products = []
                
                for product in products_data["products"]:
                    product_text = f"{product['name']} {product['description']} {product['category']}".lower()
                    if any(term in product_text for term in search_terms if len(term) > 3):
                        matching_products.append(product)
                
                if matching_products:
                    response = "I found these products that might interest you:\n\n"
                    for p in matching_products[:3]:  # Show top 3
                        response += f"**{p['name']}** - ${p['price']}\n"
                        response += f"{p['description'][:100]}...\n"
                        response += f"Stock: {p['stock']} units | Rating: {p['rating']}⭐\n\n"
                    
                    response += "Would you like more information about any of these products?"
                    return {
                        "response": response,
                        "data_source": "product_connector",
                        "products_found": len(matching_products)
                    }
            except Exception as e:
                logger.error(f"Error searching products: {e}")
        
        # Default response using knowledge base
        response = f"""Thank you for contacting Saturnin! 👋

{bot_config['knowledge_base']}

To help you better, you can:
- Check order status by providing your order number (e.g., ORD-2024-001)
- Track your shipment with tracking number (e.g., DHL-2024-TRK-001)
- Ask about product information

How can I assist you today?"""
        
        return {
            "response": response,
            "data_source": "knowledge_base"
        }
    
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return {
            "response": "I apologize, but I'm having trouble processing your request. Please try again or contact our support team at support@saturnin.com",
            "error": str(e)
        }

@bot_router.get("/bot/connectors/status")
async def get_connectors_status():
    """Check status of all connectors"""
    try:
        products = load_products()
        orders = load_shopify_orders()
        tracking = load_dhl_tracking()
        
        return {
            "connectors": [
                {
                    "name": "Product Catalog",
                    "type": "product.json",
                    "status": "connected",
                    "records": len(products["products"])
                },
                {
                    "name": "Shopify Orders",
                    "type": "shopify_demo.json",
                    "status": "connected",
                    "records": len(orders["orders"])
                },
                {
                    "name": "DHL Tracking",
                    "type": "dhl_demo.json",
                    "status": "connected",
                    "records": len(tracking["shipments"])
                }
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking connectors: {str(e)}")
