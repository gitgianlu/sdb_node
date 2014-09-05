var express = require('express');
var router = express.Router();
var ObjectId = require('mongoskin').ObjectID;

//var collection = "app_mobile"
var collection = "app_mobile_dev"
/*
 * CAZZATE API ENDPOINTS
 *TODO: 
 *- implementare auth su email e token
 */

/*
 * GET to list.
 *TODO: 
 *- richiedi solo gli ultimi 10 documenti che hanno un titolo (cazzate), da implementare il paging su richiesta del client per andare indietro nel tempo
 */

router.get('/listcazzate/:iduser/:items/:skip', function(req, res) {
    var db = req.db;
    var limit = req.params.items;
    var email = req.params.iduser;
    
    var findQuery;
    
    findUser(email,req,function(user_data){
        
    	iduser = user_data[0];
    	
    	if(iduser){
        	findQuery = {doctype: "cazzata"};
        }else{
        	findQuery = {doctype: "cazzata", iduser: ObjectId(iduser)};
        }
        
        db.collection(collection).find(findQuery).limit(10).toArray(function (err, items) {
        	res.json(items);
        	}
        );
    });  

});

/*
 * POST to add a cazzata.
 *TODO: 
 *- l'utente deve essere inviato automaticamente dal client e controllato in modo da avere un id univoco per email/device
 */

router.post('/addcazzata', function(req, res) {
    var db = req.db;

	var email = req.body.email;

	var date = Date();
	var title = req.body.title;
	var notification = req.body.notification;
	var description = req.body.description;
	var media = req.body.media;
	var doctype = "cazzata";

	findUser(email, req, function(user_data){
		iduser=user_data[0];

		var insert_stat = 
		{
			date: date,
			iduser: iduser,
			title : title,
			notification : notification,
			description: description,
			media: media,
			doctype: doctype
		}

		console.log("Insert Stat: %j", insert_stat);

	    	db.collection(collection).insert(insert_stat, function(err, result){
			res.send(
			    (err === null) ? { msg: 'stored' } : { msg: err }
			);
	    	});
	});
});


/*
 * POST to UPDATE a cazzata.
 *TODO: 
 *- la data deve essere inserita automaticamente prendendo la data di update
 *- l'utente deve essere inviato automaticamente dal client o recuperato in modo da avere un id univoco per email/device
 *- da trasformare in PUT con corpo del messaggio che contiene l'autenticazione dell'utente (UDID/email/nickname)
 *- il doctype deve essere inserito dal server e non dal client per evitare spoofing
 */

router.post('/updatecazzata', function(req, res) {
	var db = req.db;

	var idcazzata = req.body.id;
	var new_data = Date();
	var new_titolo = req.body.titolo;
	var new_notifica = req.body.notifica;
	var new_descrizione = req.body.descrizione;
	var new_media = req.body.media;

	//auth part
	var email = req.body.email;
	
	findUser(email, req, function(user_data){
		
		if(user_data[0]){
			iduser_update=user_data[0];

			findCazzata(idcazzata, req, function(cazzata_data){
	
				if(cazzata_data){

					iduser_cazzata=cazzata_data[1];		
					console.log("IdUser Cazzata: " + iduser_cazzata + " - IdUser Update: " + iduser_update);

					//permetti solo all'utente che ha creato il doc di modificarlo
					if(iduser_cazzata.toString() == iduser_update.toString()){
						var update_stat = 
						{
							$set: 	{data: new_data,
								titolo : new_titolo,
								notifica : new_notifica,
							 	descrizione: new_descrizione,
							 	media: new_media}
						}

						console.log("ID: %s - Update Stat: %j", idcazzata, update_stat);

					    	db.collection(collection).updateById(idcazzata, update_stat, function(err, result){
							res.send(
							    (err === null) ? { msg: 'updated' } : { msg: err }
							);
					    	});
					}else{
						res.send(
						    { msg: "not allowed" }
						);			
					}
				}else{
					res.send(
					    { msg: "not found" }
					);
				}
			});
		}else{
			res.send(
			    { msg: "not allowed" }
			);
		}
	});
});


/*
 * POST to delete a cazzata.
 *TODO: 
 *- solo l'utente che ha creato la cazzata può concellarla
 *- da trasformare in DELETE con corpo del messaggio che contiene l'autenticazione dell'utente (UDID/email/nickname)
 */

router.post('/deletecazzata', function(req, res) {
	var db = req.db;

	var idcazzata = req.body.id;
	var email = req.body.email;

	findUser(email, req, function(user_data){
		
		if(user_data[0]){
			iduser_update=user_data[0];

			findCazzata(idcazzata, req, function(cazzata_data){
	
				if(cazzata_data){

					iduser_cazzata=cazzata_data[1];		
					console.log("IdUser Cazzata: " + iduser_cazzata + " - IdUser Update: " + iduser_update);

					//permetti solo all'utente che ha creato il doc di cancellarlo
					if(iduser_cazzata.toString() == iduser_update.toString()){
						console.log("ID: %s - Deleting", idcazzata);
						db.collection(collection).removeById(idcazzata, function(err, result) {
							res.send((result === 1) ? { msg: 'deleted' } : { msg:'error: ' + err });
						});
					};
				};
			});
		};
	});
});


/*
 * POST to add a user.
 *TODO: 
 *- occorre inserire una logica per inviare le email di conferma utente, altrimenti uno può simulare tutti gli account email con un device
 */

router.post('/adduser', function(req, res) {

    var db = req.db;

	var new_date = Date();
	var user = req.body.user;
	var email = req.body.email;
	var udid = req.body.udid;
	var doctype = "user";
	
	findUser(email, req, function(user_data){
		var iduser = user_data[0];
		var current_udids = user_data[1];
		var current_users = user_data[2];

		console.log("User Found, _Id: " + iduser + " - Cur Udids: "+ current_udids + " - Cur Users: " + current_users); 		

		if(iduser){
	
			new_udids = current_udids;
			if(current_udids.indexOf(udid)==-1){
				new_udids.push(udid);
			}
							
			new_users = current_users;
			if(current_users.indexOf(user)==-1){
				new_users.push(user);
			}

			console.log("New Udids: \"%s\" - New Users: \"%s\" ", new_udids,new_users);

			//UPDATE EXISTING USER
			var update_stat = 
			{
				$set: 	{date: new_date,
					users: new_users,
					udids: new_udids}
			}

			console.log("UPDATE USER: ID: %s - Update Stat: %j", iduser, update_stat);

			db.collection(collection).updateById(iduser, update_stat, function(err, result){
				res.send(
			    	(err === null) ? { msg: 'stored' } : { msg: err }
				);
		   	});
		}
		else{
			//INSERT NEW USER	
	
			var insert_stat = 
			{
				date: new_date,
				users: [ user ],
				email : email,
				udids : [ udid ],
				doctype: doctype
			}

			console.log("NEW USER: Insert Stat: %j", insert_stat);

		    	db.collection(collection).insert(insert_stat, function(err, result){
				res.send(
				    (err === null) ? { msg: '' } : { msg: err }
				);
		    	});
		}
	});
});




/*
 * SUPPORT PAGES AND API CALLS AND FUNCTIONS
 */

router.get('/newuser', function(req, res) {
    res.render('newuser', { title: 'Add New User' });
});

router.get('/newcazzata', function(req, res) {
    res.render('newcazzata', { title: 'Add New Cazzata' });
});

router.get('/modifycazzata', function(req, res) {
    res.render('modifycazzata', { title: 'Modify Cazzata' });
});

router.get('/delcazzata', function(req, res) {
    res.render('delcazzata', { title: 'Delete Cazzata' });
});

router.get('/listusers', function(req, res) {
    var db = req.db;
    db.collection(collection).find({ doctype: "user" }).toArray(function (err, items) {
        res.json(items);
    });
});


var authUser = function(iduser,idcazzata){

	console.log("User: \"%s\" is asking to do something with %s...", iduser, idcazzata);
	console.log("Granted!");
	
	return true;
}



var findUser = function(email,req,callback){
    
	var db = req.db;
	var iduser,current_udids, current_users = null;
	if(email=="allusers"){
		callback(["allusers",null, null]);
	}else{
		console.log("Searching User with Email: \"%s\"...", email);
	
		db.collection(collection).find({ doctype: "user", email: email }, {_id:1, udids:1, users:1 }).toArray(
		
			function(err, array){
	
				//se il cursore ha dei documenti recuperati mette il primo sotto user (occhio a users con email uguali)
				var user = array[0];
	
				if(user){	
					iduser = user._id;
					current_udids = user.udids;
					current_users = user.users;
				}else{
					console.log("User Not Found!");
				}
				
				callback([iduser,current_udids, current_users]);
			}
		);
	}


}

var findCazzata = function(idcazzata,req,callback){

    	var db = req.db;
	var iduser= null;

	console.log("Searching Cazzata with Id: \"%s\"...", idcazzata);

	db.collection(collection).find({ doctype: "cazzata", _id: ObjectId(idcazzata) }, {_id:1, iduser:1 }).toArray(
	
		function(err, array){

			//se il cursore ha dei documenti recuperati mette il primo sotto user (occhio a users con email uguali)
			var cazzata = array[0];

			if(cazzata){	
				iduser = cazzata.iduser;
			}else{
				console.log("Cazzata Not Found!");
			}
			
			callback([idcazzata,iduser]);
		}
	);


}


/////

module.exports = router;
