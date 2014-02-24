/*
Postgresql Import Script

Name:				Create Tables
Creation Date:		February 23rd, 2014
Creation Author:	Kyle

Changelog:
Date		Name			Changes
02-23-2014	Kyle			Initial creation

*/

\echo 'Begin Creating tables...'

\ir 'MapLiteral.sql'
\ir 'MapRegion.sql'
\ir 'MapZone.sql'
\ir 'MapItem.sql'
\ir 'PublicSlug.sql'

\echo 'End Creating tables...'