const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5001;
app.use(cors());
app.use(express.json());

app.use(
  cors({
    origin: [
      
      "https://amar-shop-server.vercel.app"
      
    ],
    
  })
);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5ftvpmn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectToDatabase() {
  try {
    // await client.connect();
    console.log("Successfully connected to MongoDB!");

    const database = client.db("amarshop");
    const productsCollection = database.collection("Gadgets");

    app.get('/products', async (req, res) => {
      const { search, brand, category, price, sort, page = 1, limit = 10 } = req.query;

      let query = {};
      if (search) {
        query.name = { $regex: search, $options: 'i' };
      }
      if (brand) {
        query.brand = brand;
      }
      if (category) {
        query.category = category;
      }
      if (price) {
        if (price === 'low') {
          query.price = { $lt: 15000 };
        } else if (price === 'medium') {
          query.price = { $gte: 15000, $lte: 30000 };
        } else if (price === 'high') {
          query.price = { $gt: 30000, $lte: 50000 };
        } else if (price === 'above') {
          query.price = { $gt: 50000 };
        }
      }

      let sortOptions = {};
      if (sort === 'price-asc') {
        sortOptions.price = 1;
      } else if (sort === 'price-desc') {
        sortOptions.price = -1;
      } else if (sort === 'newest') {
        sortOptions.creationDate = -1;
      }

      const options = {
        skip: (page - 1) * limit,
        limit: parseInt(limit),
      };

      const result = await productsCollection.find(query, options).sort(sortOptions).toArray();
      const totalProducts = await productsCollection.countDocuments(query);

      res.send({
        products: result,
        totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: parseInt(page),
      });
    });

  } catch (error) {
    console.error("An error occurred while connecting to MongoDB:", error);
  }
}

connectToDatabase();

app.get('/', (req, res) => {
  res.send('AmarShop is running');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

process.on('SIGINT', async () => {
  console.log("Closing MongoDB connection");
  await client.close();
  process.exit(0);
});
