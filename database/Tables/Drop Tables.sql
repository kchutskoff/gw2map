/*
Postgresql Import Script

Name:				Drop Tables
Creation Date:		February 23rd, 2014
Creation Author:	Kyle

Changelog:
Date		Name			Changes
02-23-2014	Kyle			Initial creation

*/

\echo 'Begin Dropping tables...'

DROP TABLE PublicSlug;
DROP TABLE MapItem;
DROP TABLE MapZone CASCADE;
DROP TABLE MapRegion CASCADE;
DROP TABLE MapLiteral CASCADE;

\echo 'End Dropping tables...'