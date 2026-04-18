import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.http import models

load_dotenv()

def ingest_pdfs(data_dir="./data"):
    # 1. Initialize Qdrant Client 
    qdrant_url = os.getenv("QDRANT_URL")
    qdrant_api_key = os.getenv("QDRANT_API_KEY")
    collection_name = os.getenv("COLLECTION_NAME", "motorcycle_dmv_handbook")

    # Auto-adjust data_dir if it's not found or empty (e.g. if running from inside backend/ folder)
    # We check if the current data_dir has PDFs, if not, we check one level up.
    has_pdfs = os.path.exists(data_dir) and any(f.endswith(".pdf") for f in os.listdir(data_dir))
    
    if not has_pdfs and os.path.exists("../data"):
        if any(f.endswith(".pdf") for f in os.listdir("../data")):
            data_dir = "../data"
            print(f"📂 Found PDF files in {data_dir}")

    if qdrant_url and (qdrant_url.startswith("http") or ":" in qdrant_url):
        print(f"🌐 Connecting to Qdrant server at {qdrant_url}...")
        client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
        connection_args = {"url": qdrant_url, "api_key": qdrant_api_key}
    else:
        print(f"📂 Using local storage at {data_dir}/qdrant_db...")
        client = QdrantClient(path="./qdrant_db")
        connection_args = {"path": "./qdrant_db"}
    
    # 2. Setup Embeddings
    #instantiates the GoogleGenerativeAIEmbeddings to create embeddings
    #gemini-embedding-001 is the model used to create embeddings
    #this model is used to create embeddings for the chunks of text
    #embeddings are used to create a vector representation of the chunks of text
    #this vector representation is used to create a vector database
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    
    # 3. Load and Split Documents
    all_docs = []
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
        
    for file in os.listdir(data_dir):
        if file.endswith(".pdf"):
            print(f"📄 Processing {file}...")
            #instantiates the PyMuPDFLoader to load the pdf
            loader = PyMuPDFLoader(os.path.join(data_dir, file))
            #loads the pdf
            docs = loader.load()
            #appends the loaded pdf to the all_docs list
            all_docs.extend(docs)
            
    if not all_docs:
        print(f"❌ No PDF files found in {data_dir} directory.")
        return
    #LangChain's default tool for splitting long text into smaller,
    # semantically coherent chunks based on a list of separators
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=100,
        add_start_index=True #adds the start index of the chunk to the chunk
    )
    #splits the loaded pdf into chunks
    chunks = text_splitter.split_documents(all_docs)
    print(f"✅ Split into {len(chunks)} chunks.")

    # 4. Index into Qdrant
    print(f"🚀 Initializing Qdrant collection: {collection_name}...")
    client.close()

    # Create the vector store instance
    vector_store = QdrantVectorStore.from_documents(
        chunks[:2], # Just send 2 to initialize/recreate the collection
        embedding=embeddings,
        collection_name=collection_name,
        force_recreate=True,
        **connection_args
    )

    print(f"📦 Upserting remaining {len(chunks)-2} chunks with rate-limit handling...")
    import time
    batch_size = 5 # Small batches to stay under RPM limits
    for i in range(2, len(chunks), batch_size):
        batch = chunks[i : i + batch_size]
        try:
            vector_store.add_documents(batch)
            print(f"✅ Indexed {i + len(batch)} / {len(chunks)} chunks...")
            time.sleep(2) # 2-second delay between batches
        except Exception as e:
            if "429" in str(e):
                print("⏳ Rate limit hit. Waiting 10 seconds...")
                time.sleep(10)
                vector_store.add_documents(batch) # Retry
            else:
                raise e

    print("✨ Ingestion complete!")

if __name__ == "__main__":
    ingest_pdfs()