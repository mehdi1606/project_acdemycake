-- Fix the English name of the French pastry category ("FRENSH" typo).
-- Only that one value changes; nothing else is touched.
UPDATE course_categories SET name_en = 'FRENCH PASTRY' WHERE name_en = 'FRENSH PASTRY';
UPDATE course_categories SET name = 'FRENCH PASTRY' WHERE name = 'FRENSH PASTRY';
