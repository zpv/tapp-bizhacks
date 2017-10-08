const path = require('path')  
const express = require('express')  
const exphbs = require('express-handlebars')
const fs = require('fs')
const bodyParser = require('body-parser')
var SqlString = require('sqlstring');

var Connection = require('tedious').Connection;
var Request = require('tedious').Request;

let requestHTTP = require('request');

let accessKey = '13e13425bbb2441a9efb3e46614ed6b6';

let sentimentEndpoint = 'https://westcentralus.api.cognitive.microsoft.com/text/analytics/v2.0/sentiment';

const async = require('async');

const BlobStream = require('blob-stream')

const app = express()

var firebase = require('firebase-admin');

const session = require('express-session')  
const RedisStore = require('connect-redis')(session)

const mongoose = require('mongoose');

var config = 
{
  userName: 'tapp', // update me
  password: 'hidden', // update me
  server: 'tapp-data.database.windows.net', // update me
  options: 
     {
        database: 'tapp-data' //update me
        , encrypt: true
     }
}
var connection = new Connection(config);

// Attempt to connect and execute queries if connection goes through
connection.on('connect', function(err) 
{
  if (err) 
    {
       console.log(err)
    }
 else
    {
      //queryDatabase()
        console.log("Connected to Azure SQL Database")
    }
}
);

// function queryDatabase()

// { console.log('Reading rows from the Table...');

//     // Read all rows from table
//   request = new Request(
//        "CREATE TABLE IF NOT EXISTS `microsoft.reps` (`id` int(11) NOT NULL auto_increment, `name` varchar(250) NULL, `avgscore` int(11) NOT NULL default '0', `data` NVARCHAR(MAX), PRIMARY KEY `id`",
//           function(err, rowCount, rows) 
//              {
//                  console.log(rowCount + ' row(s) returned');
//              }
//          );

//   request.on('row', function(columns) {
//      columns.forEach(function(column) {
//          console.log("%s\t%s", column.metadata.colName, column.value);
//       });
//           });
//   connection.execSql(request);
// }

function writeRepData(name, avg, json, count)

{ 
console.log('writing data');
json = JSON.stringify(json)
console.log("count", count);
console.log(SqlString.escape(json))

    // Read all rows from table
  request = new Request(
       "IF EXISTS (select * from microsoft_reps WHERE name = '" + name + "') UPDATE microsoft_reps SET avgscore=" + avg + ", data='" + json+ "', count=" + count + " WHERE name='" + name + "' ELSE insert into microsoft_reps(name, avgscore, data, count) values('" + name + "', " + avg + ", '" + json + "', " + count + ")",
          function(err, rowCount, rows) 
             {
               console.log(err)
                 console.log(rowCount + ' row(s) returned');
             }
         );

  request.on('row', function(columns) {
     columns.forEach(function(column) {
         console.log("%s\t%s", column.metadata.colName, column.value);
      });
          });
  connection.execSql(request);
}

function writeTapData(pid, taps)

{ 

    // Read all rows from table
  request = new Request(
       "IF EXISTS (select * from microsoft_taps WHERE productId = '" + pid + "') UPDATE microsoft_taps SET taps=" + taps + " WHERE productId='" + pid + "' ELSE insert into microsoft_taps(productId, productName, taps, fulfilled) values('" + pid + "', '" + products[pid].productName + "', '" + taps + "', 0)",
          function(err, rowCount, rows) 
             {
               console.log(err)
                 console.log(rowCount + ' row(s) returned');
             }
         );

  request.on('row', function(columns) {
     columns.forEach(function(column) {
         console.log("%s\t%s", column.metadata.colName, column.value);
      });
          });
  connection.execSql(request);
}
/**
* Set to Node.js native promises
* Per http://mongoosejs.com/docs/promises.html
*/
mongoose.Promise = global.Promise;

// eslint-disable-next-line max-len
const mongoUri = `mongodb://tapp:kgpbpBaA2eTtUkLhOhBXwofpaFPGr9axbI7ehtzG4jIxRFawlKs2YEEmidvIRhszjce9FZZ71NkXrNRjpowXJg==@tapp.documents.azure.com:10255/?ssl=true`; //&replicaSet=globaldb`;

//mongoose.connect(mongoUri, { useMongoClient: true });

var tappRequestSchema = mongoose.Schema({
  pid: String,
  time: Number,
  assigned: Number
});

var TappRequest = mongoose.model('TappRequest', tappRequestSchema);

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log("connected to azure db")
});

var serviceAccount = {
  "type": "service_account",
  "project_id": "tapp-182218",
  "private_key_id": "7aac7248697df961160dbd0fa7fb165500f94c23",
  "client_email": "firebase-adminsdk-xvqhz@tapp-182218.iam.gserviceaccount.com",
  "client_id": "105033512907656269761",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://accounts.google.com/o/oauth2/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xvqhz%40tapp-182218.iam.gserviceaccount.com"
}

var products = {
  "502412": {
    "store": "microsoft",
    "productName": "Surface Pro - Intel Core m3 / 128GB SSD / 4GB RAM",
    "location": "Surface Display Table",
    "image": "surface.jpeg",
    "productLink": "https://www.microsoft.com/en-us/store/d/surface-pro/8nkt9wttrbjk/H3CS?icid=Cat_Surface-Hero1-Dual1-Pro-Starting-100117-en-us"
  },
  "1224": {
    "store": "microsoft",
    "productName": "Xbox One X 1TB Console",
    "location": "Xbox Gaming Section",
    "image": "xbox.png",
    "productLink": "https://www.microsoft.com/en-us/store/d/xbox-one-x/8NQ33JVV1S9V?cat0=devices&icid=XboxCat_Hero1_XboxOneX_Pre_Order_092417"
  }
}

//https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RW80TR?ver=0715&q=60&m=6&h=423&w=752&b=%23FFFFFFFF&f=jpg&o=f

var fbconfig = {
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: "https://tapp-182218.firebaseio.com",
};


firebase.initializeApp(fbconfig);

var ref = firebase.database().ref();

var requestsref = firebase.database().ref("microsoft")

var server = require("http").Server(app);
var io = require("socket.io").listen(server);


var handleClient = function (socket) {
        // we've got a client connection
        //socket.emit("tweet", {username: "nodesource", text: "Hello, world!"});
     socket.on('cid', function (data) {
       console.log("received client:" + data);
       requestsref.child('requests').on("child_changed", function(snapshot) {
         console.log("snapshot key", snapshot.key)
        if(snapshot.key == data) {
          if(snapshot.val().time == -1){
            socket.emit("arrived", {assignee: snapshot.val().assignee, pid: snapshot.val().pid, time: snapshot.val().time});
          } else {
            socket.emit("receive", {assignee: snapshot.val().assignee, pid: snapshot.val().pid, time: snapshot.val().time});
          }
        }
       });
     });
};

io.on("connection", handleClient);

app.engine('.hbs', exphbs({  
  defaultLayout: 'main',
  extname: '.hbs',
  layoutsDir: path.join(__dirname, 'views/layouts')
}))

app.set('view engine', '.hbs')  
app.set('views', path.join(__dirname, 'views'))

app.use(express.static(path.join(__dirname, 'public')))

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.get('/', (req, res) => {  
  let product = products[req.query.productid];
  console.log(product)
  if (product){

  let taps = 0

  request = new Request(
    "select * from microsoft_taps WHERE productId = '" + req.query.productid + "'",
       function(err, rowCount, rows) 
          {
            console.log(err)
            console.log('rows', rows)
              console.log(rowCount + ' row(s) returned');
              writeTapData(req.query.productid, taps + 1)
          }
      );

  request.on('row', function(columns) {
    taps = columns[2].value || 0
  });

  connection.execSql(request);

    
    res.render('info', {
      id: req.query.productid,
      image: product.image,
      productName: product.productName,
      productLink: product.productLink,
      title: 'tapp - Help Request',
      active: {home: true}
    })


      
  } else {
    res.send("No product with the specified ID found.")
  }

})

app.get('/unavailable', (req, res) => {  
  let product = products[req.query.productid];
  if (product){

    res.render('unavailable', {
      id: req.query.productid,
      image: product.image,
      productName: product.productName,
      productLink: product.productLink,
      title: 'tapp - Help Unavailable',
      active: {home: true}
    })


      
  } else {
    res.send("No product with the specified ID found.")
  }

})
app.get('/stats', (req, res) => {  
  let product = products[req.query.productid];

  if (product){

  let taps = 0

  request = new Request(
    "select * from microsoft_taps WHERE productId = '" + req.query.productid + "'",
       function(err, rowCount, rows) 
          {
            console.log(err)
            console.log('rows', rows)
              console.log(rowCount + ' row(s) returned');
                            
              res.render('stats', {
                id: req.query.productid,
                image: product.image,
                productName: product.productName,
                productLink: product.productLink,
                title: 'tapp - Stats',
                taps: taps,
                active: {home: true}
              })

          }
      );

  request.on('row', function(columns) {
    taps = columns[2].value || 0
  });

  connection.execSql(request);

      
  } else {
    res.send("No product with the specified ID found.")
  }

})

app.get('/request', (req, res) => {
  var newReq = requestsref.child('requests').push({
    pid: req.query.productid,
    time: parseInt((new Date().getTime() / 1000)),
    location: products[req.query.productid].location,
    assignee: false
  })

  var postID = newReq.key

  var loc = nfcTags[req.query.productid]

  res.render('home', {
    id: req.query.productid,
    location: loc,
    cid: postID,
    title: 'tapp - Staff Request',
    active: {home: true}
  })
})

app.get('/paired', (req, res) => {  
  res.render('paired', {
    cid: req.query.id,
    title: 'tapp - Staff Request',
  })
})

// app.get('/unavailable', (req, res) => {  
//   res.render('unavailable', {
//     product: productID[req.query.id],
//     title: 'tapp - Staff Request',
//   })
// })

app.get('/finished', (req, res) => {  

  let data
  let avgScore
  let count


  request = new Request(
    "select * from microsoft_reps WHERE name = '" + "SREENI" + "'",
       function(err, rowCount, rows) 
          {
            console.log(err)
            console.log('rows', rows)
              console.log(rowCount + ' row(s) returned');
              writeRepData("SREENI", avgScore, data, count)
          }
      );

  request.on('row', function(columns) {
    data = JSON.parse(columns[3].value)
    avgScore = columns[2].value

    count = columns[4].value + 1
  });
  connection.execSql(request);

  res.render('finished', {
    product: productID[req.query.id],
    title: 'tapp - Staff Request',
  })
})

app.get('/repscore', (req, res) => {  

  let score = 0;
  let count = 0;

  request = new Request(
    "select * from microsoft_reps WHERE name = '" + "SREENI" + "'",
       function(err, rowCount, rows) 
          {
            res.render('repscore', {
              score: (score * 100).toFixed(2),
              count: count,
              title: 'tapp - Staff Request',
            })
          }
      );

  request.on('row', function(columns) {
    score = columns[2].value
    count = columns[4].value
  });
  connection.execSql(request);
})



// let get_sentiments = function (documents) {
//   let body = JSON.stringify (documents);

//   let request_params = {
//       method : 'POST',
//       hostname : uri,
//       path : path,
//       headers : {
//           'Ocp-Apim-Subscription-Key' : accessKey,
//       }
//   };

//   let req = https.request (request_params, response_handler);
//   req.write (body);
//   req.end ();
// }



app.post('/feedback', (req,res) => {
  let feedback = req.body.feedback;
  let document = {"documents": [
      {
      'id': '1',
      'language': 'en',
      'text': feedback
      }
    ]
  }
  console.log(document)
  let input = JSON.stringify(document)
  requestHTTP.post(sentimentEndpoint, {
    body: input,
    headers: {'Ocp-Apim-Subscription-Key' : accessKey}
  }, function(err, resp, body) {

    let score = JSON.parse(body).documents[0].score
    res.render('feedback', {
      product: productID[req.query.id],
      title: 'Microsoft - Thank you!',
      positivity: score
    })

    let data
    let absScore = 0
    let avgScore = 0
    let count = 0

    request = new Request(
      "select * from microsoft_reps WHERE name = '" + "SREENI" + "'",
         function(err, rowCount, rows) 
            {
              console.log(err)
              console.log('rows', rows)
                console.log(rowCount + ' row(s) returned');
                writeRepData("SREENI", avgScore, data, count)
            }
        );

    request.on('row', function(columns) {
      data = JSON.parse(columns[3].value)
      console.log(data)

      data.push({"feedback": input, "score": score})

      absScore = 0;
      data.forEach((entry) => {
        absScore += entry.score;
      })

      count = columns[4].value

      avgScore = absScore / data.length;
    });
    connection.execSql(request);
    
    console.log("Feedback positivity:" + score)
    // res.send(body)
  })
})

console.log("Running....")

server.listen(3000);
