/*
Postgresql Import Script

Name:				Create Stored Procedures
Creation Date:		February 23rd, 2014
Creation Author:	Kyle

Changelog:
Date		Name			Changes
02-23-2014	Kyle			Initial creation

*/

\echo 'Begin Creating stored procedures...'

\ir 'sp_MapLiteral.sql'
\ir 'sp_MapRegion.sql'
\ir 'sp_PublicSlug.sql'

\echo 'End Creating stored procedures...'