/*
Postgresql Stored Procedure Creation Script

Creation Date:		February 23rd, 2014
Creation Author:	Kyle
Procedure Family:	MapLiteral
Functions:			insert, update, delete

Changelog:
Date		Name			Changes
02-23-2014	Kyle			Initial creation

*/
\echo 'Creating Stored Procedure sp_MapLiteral_Create...'

CREATE OR REPLACE FUNCTION sp_MapLiteral_Create(p_name varchar, p_sizeX float, p_sizeY float, p_id out uuid) AS $$
BEGIN
	p_id := uuid_generate_v4();
	INSERT INTO MapLiteral ( 
		id,			name, 		sizeX, 		sizeY ) VALUES (
		p_id,		p_name,		p_sizeX,	p_sizeY );
	IF NOT FOUND THEN
		RAISE EXCEPTION 'Failed to create MapLiteral: %, %, %, %', p_id, p_name, p_sizeX, p_sizeY USING ERRCODE = 'internal_error';
	END IF;
END;
$$ LANGUAGE plpgsql;

\echo 'Creating Stored Procedure sp_MapLiteral_Update...'

CREATE OR REPLACE FUNCTION sp_MapLiteral_Update(p_id uuid, p_name varchar = null, p_sizeX float = null, p_sizeY float = null) RETURNS VOID AS $$
BEGIN
	UPDATE MapLiteral SET 
		name = coalesce(p_name, name),
		sizeX = coalesce(p_sizeX, sizeX),
		sizeY = coalesce(p_sizeY, sizeY)
	WHERE id = p_id;

	IF NOT FOUND THEN	
		RAISE EXCEPTION 'Failed to update MapLiteral, p_id does not exist: %', p_id USING ERRCODE = 'invalid_parameter_value';
	END IF;
END;
$$ LANGUAGE plpgsql;

\echo 'Creating Stored Procedure sp_MapLiteral_Delete...'

CREATE OR REPLACE FUNCTION sp_MapLiteral_Delete(p_id uuid) RETURNS VOID AS $$
BEGIN
	DELETE FROM MapLiteral WHERE id = p_id;
	IF NOT FOUND THEN
		RAISE EXCEPTION 'Failed to delete MapLiteral, p_id does not exist: %', p_id USING ERRCODE = 'invalid_parameter_value';
	END IF;
END;
$$ LANGUAGE plpgsql;