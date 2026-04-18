import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient

load_dotenv()

def check_metadata():
    qdrant_url = os.getenv("QDRANT_URL")
    collection_name = os.getenv("COLLECTION_NAME", "motorcycle_dmv_handbook")
    
    client = QdrantClient(url=qdrant_url)
    
    # Scroll through points to see metadata structure
    points, _ = client.scroll(
        collection_name=collection_name,
        limit=1,
        with_payload=True,
        with_vectors=False
    )
    
    if points:
        print("🔍 SAMPLE METADATA FOUND:")
        print(points[0].payload)
    else:
        print("❌ No points found in collection.")

if __name__ == "__main__":
    check_metadata()
