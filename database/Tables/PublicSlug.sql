/*
Postgresql Table Creation Script

Creation Date:		February 23rd, 2014
Creation Author:	Kyle
Table Name:			Public Slug
Dependancies:		MapItem, MapZone
Stored Procs:		n/a
Views:				n/a

Changelog:
Date		Name			Changes
02-23-2014	Kyle			Initial creation

*/

\echo 'Creating table PublicSlug...'

CREATE TABLE PublicSlug (
	id				uuid		PRIMARY KEY,
	link			uuid,
	linkType		varchar,
	slug			varchar		UNIQUE,
	created			timestamp	NOT NULL DEFAULT now(),
	removed			boolean		NOT NULL DEFAULT FALSE
);

\echo 'Creating PublicSlug indexes...'

CREATE INDEX PublicSlug_index_slug_removed ON PublicSlug (slug, removed); -- quick lookup of slug by name and optionally removed
CREATE INDEX PublicSlug_index_link_linkType ON PublicSlug (link, linkType); -- quick lookup of slug by link and optionally linkType