/**
 * Generates test cases dynamically from discovered fields.
 * Order matters: create → edit → search/filter → paginate → delete
 * Edit and delete operate on the record created by happy-path.
 */

const FAKE = {
  email: `qa.auto.${Date.now()}@fideltour-qa.com`,
  emailInvalid: 'no-es-un-email',
  emailDuplicate: 'mamaroa@fideltour.com',
  text: 'QA Test Automatizado',
  textEdited: 'QA Test Editado',
  name: 'Test QA',
  surname: 'Automatizado',
  tel: '+34600000001',
  number: '42',
  date: '1990-06-15',
  searchTerm: 'QA Test',
};

function valueForField(field) {
  if (field.type === 'select') {
    const opts = (field.options || []).filter(o => o.value && o.value !== '');
    return opts.length ? opts[0].value : null;
  }
  if (field.type === 'checkbox') return true;
  if (field.type === 'email' || field.name.toLowerCase().includes('email')) return FAKE.email;
  if (field.type === 'tel' || field.name.toLowerCase().includes('phone') || field.name.toLowerCase().includes('tel')) return FAKE.tel;
  if (field.type === 'number') return FAKE.number;
  if (field.type === 'date') return FAKE.date;
  if (field.name.toLowerCase().includes('name') || field.name.toLowerCase().includes('nombre')) return FAKE.name;
  if (field.name.toLowerCase().includes('surname') || field.name.toLowerCase().includes('apellido')) return FAKE.surname;
  return FAKE.text;
}

function generateCases(fields) {
  if (!fields || fields.length === 0) return [];

  const cases = [];
  const requiredFields = fields.filter(f => f.required);
  const emailField = fields.find(f => f.type === 'email' || f.name.toLowerCase().includes('email'));
  const textField = fields.find(f => f.type === 'text' && !f.name.toLowerCase().includes('email'));
  const baseValues = Object.fromEntries(fields.map(f => [f.name, valueForField(f)]));

  // ① Happy path — creates the record we'll reuse for edit/delete
  cases.push({
    id: 'happy-path',
    name: 'Crear — datos válidos',
    description: 'Rellena todos los campos con datos correctos y guarda',
    action: 'create',
    values: { ...baseValues },
    expect: 'success',
  });

  // ② Required fields empty
  for (const field of requiredFields.slice(0, 3)) {
    cases.push({
      id: `required-empty-${field.name}`,
      name: `Validación — campo obligatorio vacío (${field.label || field.name})`,
      description: `Deja "${field.label || field.name}" vacío y envía`,
      action: 'create',
      values: { ...baseValues, [field.name]: '' },
      expect: 'validation-error',
    });
  }

  // ③ Invalid email
  if (emailField) {
    cases.push({
      id: 'email-invalid',
      name: 'Validación — email con formato inválido',
      description: 'Introduce un email sin @ y envía',
      action: 'create',
      values: { ...baseValues, [emailField.name]: FAKE.emailInvalid },
      expect: 'validation-error',
    });

    // ④ Duplicate email
    cases.push({
      id: 'email-duplicate',
      name: 'Validación — email duplicado',
      description: `Usa el email ${FAKE.emailDuplicate} que ya existe`,
      action: 'create',
      values: { ...baseValues, [emailField.name]: FAKE.emailDuplicate },
      expect: 'duplicate-or-error',
    });
  }

  // ⑤ Special chars
  if (textField) {
    cases.push({
      id: 'special-chars',
      name: 'Validación — caracteres especiales',
      description: 'Introduce caracteres especiales y HTML en un campo texto',
      action: 'create',
      values: { ...baseValues, [textField.name]: '<b>Test</b> & "comillas" ñáéíóú' },
      expect: 'success-or-sanitized',
    });
  }

  // ⑥ Search / filter
  cases.push({
    id: 'search',
    name: 'Búsqueda — filtrar por término',
    description: `Busca "${FAKE.searchTerm}" y verifica que filtra resultados`,
    action: 'search',
    searchTerm: FAKE.searchTerm,
    expect: 'results-filtered',
  });

  // ⑦ Pagination
  cases.push({
    id: 'pagination',
    name: 'Paginación — navegar a página 2',
    description: 'Verifica que existe paginación y navega a la siguiente página',
    action: 'paginate',
    expect: 'page-changed',
  });

  // ⑧ Edit — operates on the record created by happy-path
  if (textField) {
    cases.push({
      id: 'edit',
      name: 'Editar — modificar el registro creado',
      description: 'Busca el registro QA creado, lo edita y guarda',
      action: 'edit',
      searchTerm: FAKE.searchTerm,
      values: { ...baseValues, [textField.name]: FAKE.textEdited },
      expect: 'success',
    });
  }

  // ⑨ Delete — operates on the record created by happy-path
  cases.push({
    id: 'delete',
    name: 'Eliminar — borrar el registro creado',
    description: 'Busca el registro QA creado y lo elimina',
    action: 'delete',
    searchTerm: FAKE.searchTerm,
    expect: 'deleted',
  });

  return cases;
}

module.exports = { generateCases, FAKE };
