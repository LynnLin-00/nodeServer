const express = require('express');

//in order to use req.body, should parse first
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'linglin',
    password : '',
    database : 'app-db'
  }
});

// db.select('*').from('users').then(data => {
// 	console.log(data);
// })

const app = express();

app.use(bodyParser.json());
app.use(cors());



app.get('/', (req, res) => {
	res.send(database.users);
})

app.post('/signin', (req, res) => {
	  const { email, password } = req.body;
	  if (!email || !password) {
	    return res.status(400).json('incorrect form submission');
	  }
	  db.select('email', 'hash').from('login')
	    .where('email', '=', email)
	    .then(data => {
	      const isValid = bcrypt.compareSync(password, data[0].hash);
	      if (isValid) {
	        return db.select('*').from('users')
	          .where('email', '=', email)
	          .then(user => {
	            res.json(user[0])
	          })
	          .catch(err => res.status(400).json('unable to get user'))
	      } else {
	        res.status(400).json('wrong credentials')
	      }
	    })
	    .catch(err => res.status(400).json('wrong credentials'))
})

app.post('/register', (req, res) => {
	const { email, name, password } = req.body;
	const hash = bcrypt.hashSync(password);
		db.transaction(trx => {
			trx.insert({
				hash: hash,
				email: email
			})
			.into('login')
			.returning('email')
			.then(loginEmail => {
				return trx('users')
					.returning('*')
					.insert({
					email: loginEmail[0],
					name: name,
					joined: new Date()
				})
				.then(user => {
					res.json(user[0]);
				})
			})
			.then(trx.commit)
			.catch(trx.rollback)
		})		
		.catch(err => res.status(400).json('unable to register'))
	
})

app.get('/profile/:id', (req, res) => {
	const { id } = req.params;
	
	db.select('*').from('users').where({id})
	.then(user => {
		if (user.length) {
			res.json(user[0]);
		} else {
			res.status(400).json('not found');
		}
		
	})
	.catch(err => res.status(400).json('error getting user'))
	// if (!found) {
	// 	res.status(400).json('not found');
	// }
})

app.put('/image', (req, res) => {
	const { id } = req.body;
	db('users').where('id', '=', id)
	.increment('entries', 1)
	.returning('entries')
	.then(entries => {
		res.json(entries[0]);
	})
	.catch(err => res.status(400).json('unable to get count'))
	
})


// //encrypt password, better than hash, bcrypt everytime hash to different values
// 	bcrypt.hash(password, null, null, function(err, hash) {
// 	    console.log(hash);
// 	});
// // Load hash from your password DB.
// bcrypt.compare("bacon", hash, function(err, res) {
//     // res == true
// });
// bcrypt.compare("veggies", hash, function(err, res) {
//     // res = false
// });

app.listen(3000, () => {
	console.log('app is running on port 3000')
})

/*
endpoints:
/--> res = this is working
/signin --> POST(it's secure than get, has password, shouldn't be a query) = success/fail
/register --> POST = user
/profile/:userId --> GET = user
/image --> PUT --> user
*/