-- Cria o bucket de storage para contratos de alunos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-contracts',
  'student-contracts',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: qualquer usuário autenticado pode fazer upload de contratos
CREATE POLICY "authenticated_upload_student_contracts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'student-contracts'
);

-- Policy: qualquer usuário autenticado pode ver os contratos que enviou
CREATE POLICY "authenticated_select_student_contracts"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'student-contracts');

-- Policy: qualquer usuário autenticado pode atualizar contratos (substituir arquivo)
CREATE POLICY "authenticated_update_student_contracts"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'student-contracts');

-- Policy: service_role (admin) pode fazer tudo
CREATE POLICY "service_role_full_student_contracts"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'student-contracts');
