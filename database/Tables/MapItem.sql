/*
Postgresql Table Creation Script

Creation Date:		February 23rd, 2014
Creation Author:	Kyle
Table Name:			MapItem
Dependancies:		MapZone
Stored Procs:		n/a
Views:				n/a

Changelog:
Date		Name			Changes
02-23-2014	Kyle			Initial creation

*/

\echo 'Creating table MapItem...'

CREATE TABLE MapItem (
	id				uuid		PRIMARY KEY,
	gameID			int,
	name			varchar,
	type			varchar		NOT NULL,
	level			int,
	floor			int,
	positionX 		float		NOT NULL,
	positionY		float		NOT NULL,
	isChatCode		boolean		NOT NULL,
	parent			uuid 		REFERENCES MapZone(id) ON DELETE RESTRICT
);

\echo 'Creating MapItem indexes...'

CREATE INDEX MapItem_index_position ON MapItem (positionX, positionY); -- quick lookup based on position (x, y)
CREATE INDEX MapItem_index_parent ON MapItem (parent); -- quick lookup for foreign key restrictions
