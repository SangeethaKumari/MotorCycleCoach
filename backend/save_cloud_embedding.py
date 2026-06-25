import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.http import models

load_dotenv()

# Configuration defaults
DEFAULT_QDRANT_HOST = "https://a1e7f68f-fb39-4369-9ffa-1d6e614c60c2.us-west-1-0.aws.cloud.qdrant.io"
DEFAULT_COLLECTION_NAME = "motorcyclecoach"
DEFAULT_PDF_PATH = "/Users/sangeetha/SV-Summer2026/rag/personalprojects/MotorCycleCoach/data/DL-665-R2-2024-WWW.pdf"

def ingest_pdf(pdf_path=None):
    # 1. Initialize Qdrant Client for Cloud
    qdrant_url = os.getenv("QDRANT_HOST", DEFAULT_QDRANT_HOST)
    qdrant_api_key = os.getenv("QDRANT_API_KEY")
    if qdrant_api_key:
        qdrant_api_key = qdrant_api_key.strip()
    
    collection_name = os.getenv("COLLECTION_NAME", DEFAULT_COLLECTION_NAME)

    if pdf_path is None:
        pdf_path = os.getenv("PDF_PATH", DEFAULT_PDF_PATH)

    # Resolve backup paths if the absolute directory structure shifts
    if not os.path.exists(pdf_path):
        pdf_path = "./data/DL-665-R2-2024-WWW.pdf"
        if not os.path.exists(pdf_path) and os.path.exists("../data/DL-665-R2-2024-WWW.pdf"):
            pdf_path = "../data/DL-665-R2-2024-WWW.pdf"

    print(f"🌐 Connecting to Qdrant Cloud at {qdrant_url}...")
    client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
    
    # 2. Setup Embeddings
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    
    # 3. Load and Split Document
    print(f"📄 Processing {pdf_path}...")
    if not os.path.exists(pdf_path):
        print(f"❌ PDF file not found at {pdf_path}")
        return

    loader = PyMuPDFLoader(pdf_path)
    all_docs = loader.load()
        
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=100,
        add_start_index=True
    )
    chunks = text_splitter.split_documents(all_docs)
    print(f"✅ Split into {len(chunks)} chunks.")

    # Get embedding dimension dynamically to prevent any size mismatches
    print("🔮 Checking embedding dimension...")
    try:
        test_embedding = embeddings.embed_query("test query")
        vector_size = len(test_embedding)
        print(f"📊 Dynamic embedding dimension detected: {vector_size}")
    except Exception as e:
        print(f"⚠️ Failed to dynamically detect embedding size, defaulting to 768. Error: {e}")
        vector_size = 768

    # 4. Create collection
    print(f"🚀 Recreating Qdrant Cloud collection: {collection_name}...")
    client.recreate_collection(
        collection_name=collection_name,
        vectors_config=models.VectorParams(
            size=vector_size,
            distance=models.Distance.COSINE
        )
    )

    # 5. Index into Qdrant using VectorStore wrapper
    vector_store = QdrantVectorStore(
        client=client,
        collection_name=collection_name,
        embedding=embeddings
    )

    print(f"📦 Upserting remaining {len(chunks)} chunks with rate-limit handling...")
    import time
    batch_size = 5  # Small batches to stay under Google API RPM limits
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i : i + batch_size]
        try:
            vector_store.add_documents(batch)
            print(f"✅ Indexed {i + len(batch)} / {len(chunks)} chunks...")
            time.sleep(2)  # 2-second delay between batches to respect rate limits
        except Exception as e:
            if "429" in str(e):
                print("⏳ Rate limit hit. Waiting 10 seconds...")
                time.sleep(10)
                vector_store.add_documents(batch)  # Retry
            else:
                raise e

    print("✨ Ingestion to Qdrant Cloud complete!")

if __name__ == "__main__":
    ingest_pdf()
