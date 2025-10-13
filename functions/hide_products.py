import requests
import datetime
from dateutil import parser

def handler(event, context):
    SHOP_NAME = "90plustickets"
    ACCESS_TOKEN = "TVŮJ_TOKEN_ZDE"
    HEADERS = {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": ACCESS_TOKEN
    }
    API_ENDPOINT = f"https://{SHOP_NAME}.myshopify.com/admin/api/2023-07/products.json?limit=250"
    MATCHES_API = "https://dreamy-sprite-72ab2d.netlify.app/.netlify/functions/getMatches"
    TODAY = datetime.datetime.now().date()

    def get_all_products():
        products = []
        url = API_ENDPOINT
        while url:
            res = requests.get(url, headers=HEADERS)
            data = res.json()
            products += data['products']
            link_header = res.headers.get('Link')
            if link_header and 'rel="next"' in link_header:
                url = link_header.split("<")[1].split(">")[0]
            else:
                url = None
        return products

    def get_api_matches():
        try:
            res = requests.get(MATCHES_API)
            return res.json()
        except:
            return []

    def get_match_date(product, api_matches):
        title = product['title']
        for match in api_matches:
            if match['name'].lower() in title.lower():
                return parser.parse(match['date']).date()

        metafields_url = f"https://{SHOP_NAME}.myshopify.com/admin/api/2023-07/products/{product['id']}/metafields.json"
        res = requests.get(metafields_url, headers=HEADERS)
        metafields = res.json().get('metafields', [])
        for mf in metafields:
            if mf['namespace'] == 'custom' and mf['key'] == 'match_date':
                return parser.parse(mf['value']).date()
        return None

    def hide_product(product_id):
        url = f"https://{SHOP_NAME}.myshopify.com/admin/api/2023-07/products/{product_id}.json"
        payload = {
            "product": {
                "id": product_id,
                "published": False
            }
        }
        res = requests.put(url, headers=HEADERS, json=payload)
        print(f"Skryt produkt {product_id}: {res.status_code}")

    matches = get_api_matches()
    products = get_all_products()

    for product in products:
        match_date = get_match_date(product, matches)
        if match_date and match_date < TODAY:
            hide_product(product['id'])

    return {
        "statusCode": 200,
        "body": "Hotovo, produkty po zápase byly skryty."
    }