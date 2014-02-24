/*
Postgresql Table Creation Script

Creation Date:		February 23rd, 2014
Creation Author:	Kyle
Table Name:			MapZone
Dependancies:		MapRegion
Stored Procs:		n/a
Views:				n/a

Changelog:
Date		Name			Changes
02-23-2014	Kyle			Initial creation

*/

\echo 'Creating table MapZone...'

CREATE TABLE MapZone (
	id				uuid		PRIMARY KEY,
	name			varchar,
	gameID			int,
	minLevel		int,
	maxLevel		int,
	defaultFloor	int,
	maxX			float		NOT NULL,
	maxY			float		NOT NULL,
	minX			float		NOT NULL,
	minY			float		NOT NULL,
	worldMaxX		float		NOT NULL,
	worldMaxY		float		NOT NULL,
	worldMinX		float		NOT NULL,
	worldMinY		float		NOT NULL,
	parent			uuid		REFERENCES MapRegion(id) ON DELETE RESTRICT
);

\echo 'Creating MapZone indexes...'

CREATE INDEX MapZone_index_worldposition ON MapZone (worldMaxX, worldMaxY, worldMinX, worldMinY); -- quick lookup based on area (maxX, maxY, minX, minY)
CREATE INDEX MapZone_index_parent ON MapZone (parent); -- quick lookup for foreign key restrictions