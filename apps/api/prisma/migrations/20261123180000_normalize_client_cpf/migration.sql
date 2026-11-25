-- O CPF passa a ser gravado só com dígitos (o DTO normaliza na entrada). Os
-- já gravados com pontuação, vindos da importação CSV, são normalizados aqui
-- para que o índice único clients_cpf_unique_active os compare pelo mesmo
-- critério. Uma linha cuja forma normalizada já pertence a outro cliente ativo
-- fica como está: é duplicata real e precisa ser resolvida à mão — atualizá-la
-- derrubaria a migration no índice único.
UPDATE "clients" AS c
SET "cpf" = regexp_replace(c."cpf", '\D', '', 'g')
WHERE c."cpf" ~ '\D'
  AND NOT EXISTS (
    SELECT 1
    FROM "clients" AS other
    WHERE other."id" <> c."id"
      AND other."deleted_at" IS NULL
      AND regexp_replace(other."cpf", '\D', '', 'g') = regexp_replace(c."cpf", '\D', '', 'g')
  );
