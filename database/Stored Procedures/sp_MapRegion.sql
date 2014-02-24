/*
Postgresql Stored Procedure Creation Script

Creation Date:		February 23rd, 2014
Creation Author:	Kyle
Procedure Family:	MapRegion
Functions:			insert, update, delete

Changelog:
Date		Name			Changes
02-23-2014	Kyle			Initial creation

*/
\echo 'Creating Stored Procedure sp_MapRegion_Create...'

CREATE OR REPLACE FUNCTION sp_MapRegion_Create(p_gameID int , p_name varchar, p_labelX float, p_labelY float, p_parent uuid, p_id out uuid) AS $$
BEGIN
	p_id := uuid_generate_v4();
	INSERT INTO MapRegion ( 
		id,		gameID,		name, 	labelX, 	labelY,		parent ) VALUES (
		p_id,	p_gameID,	p_name,	p_labelX,	p_labelY,	p_parent);
	IF NOT FOUND THEN
		RAISE EXCEPTION 'Failed to create MapRegion: %, %, %, %, %, %', p_id, p_gameID, p_name, p_labelX, p_labelY, p_parent USING ERRCODE = 'internal_error';
	END IF;
END;
$$ LANGUAGE plpgsql;

\echo 'Creating Stored Procedure sp_MapRegion_Update...'

CREATE OR REPLACE FUNCTION sp_MapRegion_Update(p_id uuid, p_gameID int = null, p_name varchar = null, p_labelX float = null, p_labelY float = null, p_parent uuid = null) RETURNS VOID AS $$
BEGIN
	UPDATE MapRegion SET 
		p_gameID = coalesce(p_gameID, gameID),
		name = coalesce(p_name, name),
		labelX = coalesce(p_labelX, labelX),
		labelY = coalesce(p_labelY, labelY),
		parent = coalesce(p_parent, parent)
	WHERE id = p_id;

	IF NOT FOUND THEN	
		RAISE EXCEPTION 'Failed to update MapRegion, p_id does not exist: %', p_id USING ERRCODE = 'invalid_parameter_value';
	END IF;
END;
$$ LANGUAGE plpgsql;

\echo 'Creating Stored Procedure sp_MapRegion_Delete...'

CREATE OR REPLACE FUNCTION sp_MapRegion_Delete(p_id uuid) RETURNS VOID AS $$
BEGIN
	DELETE FROM MapRegion WHERE id = p_id;
	IF NOT FOUND THEN
		RAISE EXCEPTION 'Failed to delete MapRegion, p_id does not exist: %', p_id USING ERRCODE = 'invalid_parameter_value';
	END IF;
END;
$$ LANGUAGE plpgsql;