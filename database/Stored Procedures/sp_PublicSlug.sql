/*
Postgresql Stored Procedure Creation Script

Creation Date:		February 23rd, 2014
Creation Author:	Kyle
Procedure Family:	PublicSlug
Functions:			insert, update, delete, genSlug

Changelog:
Date		Name			Changes
02-23-2014	Kyle			Initial creation

*/

\echo 'Creating Stored Procedure sp_PublicSlug_Generate_Slug...'

CREATE OR REPLACE FUNCTION sp_PublicSlug_Generate_Slug(name varchar, size int, slug out varchar) AS $$
DECLARE
	index int := 2;
	parts varchar[];
BEGIN
	-- set string to lower case
	slug := lower(name);
	-- remove any non-alpah-numeric + spaces, dashes, underscores (covered in \w)
	slug := regexp_replace(slug, '([^\w\s-])+', '', 'g');
	-- split string into array
	parts := regexp_split_to_array(slug, '(\s|_|-)');
	-- in case string is already too long
	slug := substr(parts[1], 1, size);

	-- add on parts until we can't fit any more
	LOOP
		IF index <= array_length(parts, 1) AND (length(slug) + 1 + length(parts[index])) < size THEN
			IF length(parts[index]) > 0 THEN
				slug := concat(slug, '-', parts[index]);
			END IF;
			index := index + 1;
		ELSE
			EXIT;
		END IF;
	END LOOP;
END;
$$ LANGUAGE plpgsql;

\echo 'Creating Stored Procedure sp_PublicSlug_Create...'

CREATE OR REPLACE FUNCTION sp_PublicSlug_Create(p_link uuid, p_linkType varchar, p_id out uuid) AS $$
DECLARE
	link_name varchar := null;
	slug_base varchar := null;
	slug_count int := 0;
	slug_current varchar := null;
BEGIN
	p_id := uuid_generate_v4();
	-- get slug owner
	CASE p_linkType
		WHEN 'item' THEN
			link_name := (SELECT name FROM MapItem WHERE id = p_link);
		WHEN 'zone' THEN
			link_name := (SELECT name FROM MapZone WHERE id = p_link);
		WHEN 'region' THEN
			link_name := (SELECT name FROM MapRegion WHERE id = p_link);
	END CASE;

	IF link_name IS NOT NULL THEN
		-- get the slug base
		slug_base := (SELECT sp_PublicSlug_Generate_Slug(link_name, 40));
		slug_current := slug_base;
		-- determine if anyone has it, and keep going up til someone doesn't
		LOOP
			IF NOT EXISTS (SELECT 1 FROM PublicSlug WHERE slug = slug_current) THEN
				EXIT;
			ELSE
				slug_count := slug_count + 1;
				slug_current := slug_base || slug_count;
			END IF;
		END LOOP;

		-- find any old slugs pointing to this link and 'remove' them

		UPDATE PublicSlug SET
			removed = TRUE 
			WHERE link = p_link;

		INSERT INTO PublicSlug (
			id,		link,		linkType,		slug,			created,	removed ) VALUES (
			p_id,	p_link,		p_linkType,		slug_current,	now(),		false );

		IF NOT FOUND THEN
			RAISE EXCEPTION 'Failed to create PublicSlug: %, %, %, %', p_id, p_link, p_linkType, slug_current USING ERRCODE = 'internal_error';
		END IF;
	ELSE
		RAISE EXCEPTION 'Failed to create PublicSlug. p_link and p_linkType did not point to any entry: %, %', p_link, p_linkType USING ERRCODE = 'invalid_parameter_value';
	END IF;
END;
$$ LANGUAGE plpgsql;

\echo 'Creating Stored Procedure sp_PublicSlug_Delete...'

CREATE OR REPLACE FUNCTION sp_PublicSlug_Delete(p_id uuid) RETURNS VOID AS $$
BEGIN
	DELETE FROM PublicSlug WHERE id = p_id;
	IF NOT FOUND THEN
		RAISE EXCEPTION 'Failed to delete PublicSlug, p_id does not exist: %', p_id USING ERRCODE = 'invalid_parameter_value';
	END IF;
END;
$$ LANGUAGE plpgsql;

\echo 'Creating Stored Procedure sp_PublicSlug_DeleteAllForLink...'

CREATE OR REPLACE FUNCTION sp_PublicSlug_DeleteAllForLink(p_link uuid) RETURNS VOID AS $$
BEGIN
	DELETE FROM PublicSlug WHERE id IN 
		(SELECT id FROM PublicSlug WHERE link = p_link);
	IF NOT FOUND THEN
		RAISE EXCEPTION 'Failed to delete PublicSlugs for Link, p_link does not point to any entry: %', p_link USING ERRCODE = 'invalid_parameter_value';
	END IF;
END;
$$ LANGUAGE plpgsql;