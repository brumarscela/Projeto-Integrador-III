create database forum charset latin1 collate latin1_general_cs;
use forum;

create table Usuario(
	id_usuario int auto_increment primary key,
    nom_usuario varchar(30) not null,
    senha varchar(255) not null,
    email varchar(255) not null
);

create table Enquete(
	id_enquete int auto_increment primary key,
    ass_enquete varchar(255) not null,
    post_enquete text not null,
    categoria varchar(255) not null
);

create table Postagem(
	conteudo_post text not null,
    data_post datetime not null,
    enquete_post int not null,
    foreign key (enquete_post) references Enquete(id_enquete)
);

drop table usuario; drop table postagem; drop table enquete;

select * from usuario;
select * from enquete;
select * from postagem;