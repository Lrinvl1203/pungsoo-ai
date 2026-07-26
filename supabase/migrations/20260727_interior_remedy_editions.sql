-- Preserve the automatically selected PUNGSOO Signature artwork while allowing
-- one separately generated Interior Edition artwork per analysis.

alter table analysis_history
  add column if not exists interior_remedy_art_url text,
  add column if not exists interior_style_id text;

alter table analysis_history
  drop constraint if exists analysis_history_interior_style_id_check;

alter table analysis_history
  add constraint analysis_history_interior_style_id_check
  check (
    interior_style_id is null
    or interior_style_id in (
      'art_nouveau',
      'bauhaus',
      'art_deco',
      'midcentury',
      'renaissance',
      'impressionist',
      'ukiyoe',
      'cinematic_anime'
    )
  );
