/*
Postgresql Creation Script

Name:				Create All
Creation Date:		February 23rd, 2014
Creation Author:	Kyle

Changelog:
Date		Name			Changes
02-23-2014	Kyle			Initial creation

*/
\echo 'Begin All Creation...'

\ir 'Tables/Create Tables.sql'
\ir 'Stored Procedures/Create Stored Procedures.sql'
\ir 'Views/Create Views.sql'

\echo 'End All Creation...'