/*
Postgresql Creation Script

Name:				Drop All
Creation Date:		February 23rd, 2014
Creation Author:	Kyle

Changelog:
Date		Name			Changes
02-23-2014	Kyle			Initial creation

*/
\echo 'Begin All Dropping...'

\ir 'Tables/Drop Tables.sql'
\ir 'Stored Procedures/Drop Stored Procedures.sql'
\ir 'Views/Drop Views.sql'

\echo 'End All Dropping...'