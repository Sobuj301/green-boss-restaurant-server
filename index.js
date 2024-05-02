const express = require('express')
const cors = require('cors')
const app = express()
const jwt = require('jsonwebtoken');
const stripe = require('stripe')('sk_test_51P3m1CFehRfyAwwmRnTcvKVhPeIw9fKkhHFmqX2WHtlf5owHKeDrLTgwecvg4oipOzDOjQcX3DmomPZI7Tu0G6Qn00RS58VZak')
const port = process.env.PORT || 5000
// ixeBZMkLErdNGWjf

app.use(cors())
app.use(express.json())

const verifyToken = async(req,res,next)=>{
  console.log('inside verifyToken',req.headers.authorization)
  if(!req.headers.authorization){
    return res.status(401).send({message:"forbidden token"})
  }
  const token = req.headers.authorization.split(' ')[1]
  jwt.verify(token,'secret',(err,decoded)=>{
    if(err){
      return res.status(401).send({message:"forbidden token"})
    }
    
    req.decoded = decoded
    next()

  })
}

const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
const uri = "mongodb+srv://sobujrana43997:ixeBZMkLErdNGWjf@cluster0.udy85xl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

             app.post('/jwt',(req,res) =>{
              const user = req.body
              const token =jwt.sign(user,"secret",{expiresIn:'1h'})
              res.send({token})
             })
             
              const menuCollection = client.db("greenDb").collection('menu')
              const reviewsCollection = client.db("greenDb").collection('reviews')
              const cartsCollection = client.db("greenDb").collection('carts')
              const usersCollection = client.db("greenDb").collection('users')
              const paymentsCollection = client.db("greenDb").collection('payments')
              

              app.get('/users/admin/:email',verifyToken,async(req,res)=>{
                const email = req.params.email;
                if(email !== req.decoded.email){
                  return res.status(401).send({message:"forbidden token"}) 
                }
                const query ={email:email}
                const user = await usersCollection.findOne(query)
                let isAdmin = false
                if(user){
                  isAdmin = user?.role === "admin"
                }
                res.send({isAdmin})

              })
            
            app.patch('/users/:id',async(req,res) =>{
              const id = req.params.id;
              const filter = {_id:new ObjectId(id)}
              const updateDoc = {
                $set:{
                  role:'admin'
                }
              }
              const result = await usersCollection.updateOne(filter,updateDoc)
              res.send(result)
            })

            app.delete('/users/:id',async(req,res)=>{
              const id = req.params.id;
              const query ={_id: new ObjectId(id)}
              const result = await usersCollection.deleteOne(query)
              res.send(result)
            })

            app.get('/users',verifyToken,async(req,res) =>{
              const result = await usersCollection.find().toArray()
              res.send(result)
            })  

            app.post('/users',async(req,res) =>{
              const user = req.body;
              const email = user.email;
              const query = {email:email}
              const existingUser =await usersCollection.findOne(query)
              console.log('existing',existingUser)
              if(existingUser){
                return res.send({message:"already added"})
              }
              const result = await usersCollection.insertOne(user)
              res.send(result)
            })
             
             app.delete('/carts/:id',async(req,res) =>{
              const id = req.params.id;
              const query = {_id:new ObjectId(id)}
              const result = await cartsCollection.deleteOne(query)
              res.send(result)
             })
             
             app.get('/carts',async(req,res)=>{
              const email = req.query.email
              const query = {email:email}
              const result = await cartsCollection.find(query).toArray()
              res.send(result)
             })


              app.post('/carts',async(req,res) =>{
                const cart = req.body
                const result = await cartsCollection.insertOne(cart)
                res.send(result)
              })

              app.get('/reviews',async(req,res)=>{
                const result =await reviewsCollection.find().toArray()
                res.send(result)
              })

              app.patch('/menu/:id',async(req,res)=>{
                const id = req.params.id;
                console.log("koi",id)
                const item = req.body;
                const filter ={_id:id}
                const updateDoc = {
                  $set:{
                    name:item.name,
                    category:item.category,
                    price:item.price,
                    image:item.image,
                    recipe:item.recipe
                  }
                }
                const result = await menuCollection.updateOne(filter,updateDoc)
                res.send(result)
              })

              app.get('/menu/:id',async(req,res) =>{
                const id = req.params.id;
                const query ={_id:id}
                const result = await menuCollection.findOne(query)
                res.send(result)
              })

              app.delete('/menu/:id',async(req,res)=>{
                const id = req.params.id;
                const query = {_id: new ObjectId(id)}
                const result =await menuCollection.deleteOne(query)
                res.send(result)
              })

              app.post('/menu',verifyToken,async(req,res)=>{
                const item = req.body;
                const result = await menuCollection.insertOne(item)
                res.send(result)
              })


              app.get('/menu',async(req,res)=>{
                const result =await menuCollection.find().toArray()
                res.send(result)
              })


              app.post('/create-payment-intent',async(req,res)=>{
                const {price} = req.body;
                const amount = parseInt(price*100)
                console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaa',amount)

                const paymentIntent = await stripe.paymentIntents.create({
                  amount:amount,
                  currency: "usd",
                  payment_method_types:['card']

                })
                res.send({
                  clientSecret: paymentIntent.client_secret,
                })
              })
              

              app.get('/payment/:email',async(req,res) =>{
                const query ={email:req.params.email}
                  
                // if(req.params.email !== req.decoded.email){
                //   return res.status(403).send({message:"forbidden access"})
                // }
                const result = await paymentsCollection.find(query).toArray()
                res.send(result)
              })

              app.post('/payment',async(req,res) =>{
                const payment = req.body;
                const paymentResult = await paymentsCollection.insertOne(payment)
                console.log(payment)

                const query ={_id:{
                  $in:payment.cartIds.map(id => new ObjectId(id))
                }}
                const deleteResult = await cartsCollection.deleteMany(query)
                res.send({paymentResult,deleteResult})
              })

              app.get('/admin-states',verifyToken,async(req,res)=>{
                const users = await usersCollection.estimatedDocumentCount()
                const menuItem = await menuCollection.estimatedDocumentCount()
                const order = await paymentsCollection.estimatedDocumentCount()
                const payments = await paymentsCollection.find().toArray()
                const revenue = payments.reduce((total,payment)=>total + payment.price,0)
                res.send({
                  users,
                menuItem,
                order,
                revenue
                })
              })

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World PAYment green boss is running')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})