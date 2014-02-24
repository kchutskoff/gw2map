/*
Postgresql Table Creation Script

Creation Date:		February 23rd, 2014
Creation Author:	Kyle
Table Name:			MapRegion
Dependancies:		MapLiteral
Stored Procs:		n/a
Views:				n/a

Changelog:
Date		Name			Changes
02-23-2014	Kyle			Initial creation

*/

\echo 'Creating table MapRegion...'

CREATE TABLE MapRegion (
	id				uuid		PRIMARY KEY,
	gameID			int,
	name 			varchar,
	labelX			float		NOT NULL,
	labelY			float		NOT NULL,
	parent			uuid		REFERENCES MapLiteral(id) ON DELETE RESTRICT
);

\echo 'Creating MapRegion indexes...'

CREATE INDEX MapRegion_index_parent ON MapRegion (parent); -- quick lookup for foreign key restrictions