/*
Postgresql Import Script

Name:				Drop Stored Procedures
Creation Date:		February 23rd, 2014
Creation Author:	Kyle

Changelog:
Date		Name			Changes
02-23-2014	Kyle			Initial creation

*/

\echo 'Begin Dropping stored procedures...'

CREATE OR REPLACE FUNCTION f_delfunc(_name varchar, output out varchar) AS
$func$
BEGIN

EXECUTE (
	SELECT string_agg(format('DROP FUNCTION %s(%s);' ,oid::regproc ,pg_catalog.pg_get_function_identity_arguments(oid)) ,E'\n')
   	FROM   pg_proc
   	WHERE  lower(proname) = lower(_name)
   	AND    pg_function_is_visible(oid));
	output := 'Deleted Stored Function: ' || _name;
EXCEPTION
	WHEN null_value_not_allowed THEN
		output := '** NOTICE: Stored Function does not exist: ' || _name || ' **';
END
$func$ LANGUAGE plpgsql;


SELECT f_delfunc('sp_MapLiteral_Create');
SELECT f_delfunc('sp_MapLiteral_Update');
SELECT f_delfunc('sp_MapLiteral_Delete');

SELECT f_delfunc('sp_MapRegion_Create');
SELECT f_delfunc('sp_MapRegion_Update');
SELECT f_delfunc('sp_MapRegion_Delete');

SELECT f_delfunc('sp_PublicSlug_Generate_Slug');
SELECT f_delfunc('sp_PublicSlug_Create');
SELECT f_delfunc('sp_PublicSlug_Delete');
SELECT f_delfunc('sp_PublicSlug_DeleteAllForLink');


\echo 'End Dropping stored procedures...'