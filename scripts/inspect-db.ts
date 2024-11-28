import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function inspectPineconeDB() {
  try {
    // Initialize Pinecone
    const pinecone = new Pinecone();
    const indexName = process.env.PINECONE_INDEX_NAME!;
    
    if (!indexName) {
      throw new Error('PINECONE_INDEX_NAME not found in environment variables');
    }

    console.log('\n🔍 Connecting to Pinecone index:', indexName);
    const index = pinecone.Index(indexName);

    // Get index statistics
    console.log('\n📊 Fetching index statistics...');
    const stats = await index.describeIndexStats();
    
    console.log('\nIndex Statistics:');
    console.log('-----------------');
    console.log(`Total Record Count: ${stats.totalRecordCount}`);
    console.log(`Dimension: ${stats.dimension}`);
    console.log('\nNamespace Distribution:');
    if (stats.namespaces) {
      for (const [namespace, stat] of Object.entries(stats.namespaces)) {
        console.log(`- ${namespace || 'default'}: ${stat.recordCount} records`);
      }
    }

    // Create a zero vector for querying (using the index dimension)
    const dimension = stats.dimension || 1536; // Use index dimension or default to 1536
    const queryVector = new Array(dimension).fill(0);

    // Query all documents
    console.log('\n📚 Fetching documents...');
    const queryResponse = await index.query({
      vector: queryVector,
      topK: 100,
      includeMetadata: true,
      includeValues: false,
    });

    const matches = queryResponse.matches || [];
    console.log(`\nFound ${matches.length} documents`);

    // Analyze metadata fields
    const metadataFields = new Set<string>();
    matches.forEach(match => {
      if (match.metadata) {
        Object.keys(match.metadata).forEach(key => metadataFields.add(key));
      }
    });

    console.log('\n📋 Available Metadata Fields:');
    console.log('-------------------------');
    console.log(Array.from(metadataFields).sort().join('\n'));

    // Display document details
    console.log('\n📖 Document Details:');
    console.log('----------------');
    
    matches.forEach((match, idx) => {
      console.log(`\nDocument ${idx + 1}:`);
      console.log('-------------');
      console.log('ID:', match.id);
      console.log('Score:', match.score);
      
      if (match.metadata) {
        console.log('\nMetadata:');
        // Format metadata for better readability
        const formattedMetadata: Record<string, unknown> = { ...match.metadata };

        // Truncate long text fields for readability
        ['content', 'excerpt'].forEach(field => {
          if (typeof match.metadata?.[field] === 'string') {
            formattedMetadata[field] = (match.metadata[field] as string).substring(0, 200) + '...';
          }
        });

        console.dir(formattedMetadata, { depth: null, colors: true });
      }
    });

    // Print summary statistics
    console.log('\n📈 Summary:');
    console.log('---------');
    console.log(`Total documents: ${matches.length}`);
    console.log(`Metadata fields: ${metadataFields.size}`);
    
    // Check for potential issues
    const documentsWithoutTitle = matches.filter(m => !m.metadata?.title).length;
    const documentsWithoutContent = matches.filter(m => !m.metadata?.content).length;
    
    if (documentsWithoutTitle > 0 || documentsWithoutContent > 0) {
      console.log('\n⚠️  Potential Issues:');
      console.log('------------------');
      if (documentsWithoutTitle > 0) {
        console.log(`- ${documentsWithoutTitle} documents missing title`);
      }
      if (documentsWithoutContent > 0) {
        console.log(`- ${documentsWithoutContent} documents missing content`);
      }
    }

  } catch (error) {
    console.error('\n❌ Error inspecting Pinecone DB:', error);
    throw error;
  }
}

// Run the inspection
console.log('🚀 Starting Pinecone DB inspection...');

inspectPineconeDB()
  .then(() => {
    console.log('\n✅ Inspection complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });