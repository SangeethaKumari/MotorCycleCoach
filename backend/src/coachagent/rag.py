import os
import logging
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient

load_dotenv()
logger = logging.getLogger(__name__)

# Single instance source tracker
class SourceTracker:
    _sources = []

    @classmethod
    def add(cls, source, page):
        print(f"📌 [DEBUG] Adding source: {source} (Page {page})")
        cls._sources.append({"source": source, "page": page})

    @classmethod
    def get_all(cls):
        print(f"📤 [DEBUG] Retrieval requested. Current count: {len(cls._sources)}")
        sources = list(cls._sources)
        cls._sources = [] # Reset for next turn
        return sources

def get_last_sources():
    return SourceTracker.get_all()

def get_vector_store():
    qdrant_url = os.getenv("QDRANT_URL")
    qdrant_host = os.getenv("QDRANT_HOST")
    qdrant_port = os.getenv("QDRANT_PORT")
    qdrant_api_key = os.getenv("QDRANT_API_KEY")
    if qdrant_api_key:
        qdrant_api_key = qdrant_api_key.strip()
    collection_name = os.getenv("COLLECTION_NAME", "motorcycle_dmv_handbook")
    
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    
    if qdrant_url and (qdrant_url.startswith("http") or ":" in qdrant_url):
        client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
    elif qdrant_host and (qdrant_host.startswith("http://") or qdrant_host.startswith("https://")):
        client = QdrantClient(url=qdrant_host, api_key=qdrant_api_key)
    elif qdrant_host:
        port = int(qdrant_port) if qdrant_port else 6333
        client = QdrantClient(host=qdrant_host, port=port, api_key=qdrant_api_key)
    else:
        client = QdrantClient(path="./qdrant_db")
        
    return QdrantVectorStore(
        client=client,
        collection_name=collection_name,
        embedding=embeddings
    )

def search_handbook(query: str, k: int = 3):
    """
    Search the official California Motorcycle Handbook for technical rules and laws.
    """
    try:
        print(f"📖 [DEBUG] Searching handbook for: {query}")
        store = get_vector_store()
        docs = store.similarity_search(query, k=k)
        
        # Track sources for the UI
        for doc in docs:
            source = doc.metadata.get('source', 'Manual')
            page = doc.metadata.get('page', 'Unknown')
            SourceTracker.add(source, page)
            
        return "\n\n".join([doc.page_content for doc in docs])
    except Exception as e:
        print(f"❌ [DEBUG] Search error: {e}")
        return f"Error searching handbook: {str(e)}"
