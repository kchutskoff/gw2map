/*
Postgresql Table Creation Script

Creation Date:		February 23rd, 2014
Creation Author:	Kyle
Table Name:			MapLiteral
Dependancies:		n/a
Stored Procs:		n/a
Views:				n/a

Changelog:
Date		Name			Changes
02-23-2014	Kyle			Initial creation

*/

\echo 'Creating table MapLiteral...'

CREATE TABLE MapLiteral (
	id 				uuid 		PRIMARY KEY,
	name			varchar,
	sizeX			float		NOT NULL,
	sizeY			float		NOT NULL
);

\echo 'Creating MapLiteral indexes...'