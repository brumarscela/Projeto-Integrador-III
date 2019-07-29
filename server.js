//Importa os modulo necessarios e define algumas constantes
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mysql = require("mysql");
const http = require("http").Server(app);
const io = require("socket.io")(http);

function addUsuario(con, nome, senha, email){
	const sql = "INSERT INTO Usuario (nom_usuario, senha, email) VALUES ?";
	const valores = [[nome, senha, email]];
	con.query(sql, [valores], function (error, results, fields){
			if(error) return console.log( error )
	});
}

function addEnquete(con, assunto, postagem, categoria){
	const sql = "INSERT INTO Enquete (ass_enquete, post_enquete, categoria) VALUES ?";
	const valores = [[assunto, postagem, categoria]];
	con.query(sql, [valores], function (error, results, fields){
		if(error) return console.log(error);
	});	
}

function addPostagem(con, conteudo, data, id_enquete){
	const sql = "INSERT INTO Postagem (conteudo_post, data_post, enquete_post) VALUES ?";
	const valores = [[conteudo, data, id_enquete]];
	con.query(sql, [valores], function(error, results, fields){
		if(error) return console.log(error);
	});
}

function buscarUsuario(con, nome, senha, callback){
	const sql = "SELECT * FROM Usuario WHERE nom_usuario = ? and senha = ?";
	const id_validar = [nome, senha];
	con.query(sql, id_validar, function(error, results, fields){
		if(error) return callback(error, null);
		callback(null, results);
	});
}

function checarUnicidade(con, nome, callback){
	const sql = "SELECT * FROM Usuario WHERE nom_usuario = ?";
	const id_validar = [nome];
	con.query(sql, id_validar, function(error, results, fields){
		if(error) return callback(error, null);
		callback(null, results);
	});
}

function buscarRespostas(con, id_enquete, callback){
	const sql = "SELECT * FROM Postagem WHERE enquete_post = ?";
	const id = [[id_enquete]];
	con.query(sql, [id], function(error, results, fields){
		if(error) return callback(error, null);
		callback(null, results);
	});
}

function buscarEnquetes(con, id_categoria, callback){
	const sql = "SELECT * FROM Enquete WHERE categoria = ?";
	const id = [[id_categoria]];
	con.query(sql, [id], function(error, results, fields){
		if(error) callback(error, null);
		callback(null, results);
	})
}

function buscarTitulo(con, id_enquete, callback){
	const sql = "SELECT ass_enquete FROM Enquete WHERE id_enquete = ?";
	const id = [[id_enquete]];
	con.query(sql, [id], function(error, results, fields){
		if(error) callback(error, null);
		callback(null, results);
	})
}

function atualizarLogado(con, nome){
	const sql = "UPDATE Usuario SET logado = true WHERE nom_usuario = ?";
	const valor = [[nome]]
	con.query( sql, [valor], function(error, results, fields){
		if(error) return console.log( error );
	})
}

//Cria a conexao
var conexao = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "root",
	database: "forum"
});

//Conecta
conexao.connect();

app.use(bodyParser.urlencoded({extend: true}));
app.use(bodyParser.json());
app.use(express.static(__dirname + "/public"));

//Envia o index.html
app.get("/", function(req, res){
	res.sendFile(__dirname + "/public/index.html");
});

io.on("connection", function(socket){
	//Recebe dados para o registro
	socket.on("enviarDadosUsuario", function(dados){
		checarUnicidade( conexao, dados.nome, function( err, data){
			if (err){
				console.log( err );
			}
			else{
				if ( data.length == 0 ){
					addUsuario(conexao, dados.nome, dados.senha, dados.email, socket);
					socket.emit("unicidade", 1);
				}
				else{
					socket.emit("unicidade", 0);
				}
			}
		});
	});

	//Recebe dados para validacao de login
	socket.on("validarLogin", function(dados){
		buscarUsuario(conexao, dados.nome, dados.senha, function(err, data){
			if (err){
				console.log(err);
			}
			else{
				//Envia resposta para o client-side
				socket.emit("resposta", data);
			}
		});
	});

	//Recebe requerimento do client-side para mostrar as enquetes mais visitadads
	socket.on("requerimentoEnquetes", function(id_categoria){
		buscarEnquetes(conexao, id_categoria, function(err, data){
			if (err){
				console.log(err);
			}
			else{
				//Envia resposta para o client-side
				socket.emit("enquetesSelecionadas", data);
			}
		});
	});

	//Recebe requerimentos do client-side para mostrar as postagens na enquete clicada
	socket.on("requerimentoPostagens", function(id_enquete){
		buscarRespostas(conexao, id_enquete, function(err, data){
			if (err){
				console.log(err);
			}
			else{
				//Envia resposta para o client-side
				socket.emit("respostasSelecionadas", data);
			}
		});
	});

	socket.on("tituloEnquete", function(id_enquete){
		buscarTitulo( conexao, id_enquete, function( err, data ){
			if (err){
				console.log( err );
			}
			else{
				socket.emit("titulo", data);
			}
		});
	});

	socket.on("enviarResposta", function(data){
		addPostagem(conexao, data.postagem, data.data_hora, data.id_enquete);
	})

	//Adiciona as enquetes cadastradas;
	socket.on("enviarDadosEnquete", function(dados){
		addEnquete(conexao, dados.assunto, dados.postagem, dados.categoria);
	});
});	

http.listen(3000);