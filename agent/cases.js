/**
 * Generates test cases dynamically from discovered fields.
 */

const FAKE = {
  email: `qa.auto.${Date.now()}@fideltour-qa.com`,
  emailInvalid: 'no-es-un-email',
  emailDuplicate: 'mamaroa@fideltour.com',
  text: 'QA Test Automatizado',
  name: 'Test QA',
  surname: 'Automatizado',
  tel: '+34600000001',
  number: '42',
  date: '1990-06-15',
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
  const baseValues = Object.fromEntries(fields.map(f => [f.name, valueForField(f)]));

  // ① Happy path
  cases.push({
    id: 'happy-path',
    name: 'Happy path — datos válidos',
    description: 'Rellena todos los campos con datos correctos y guarda',
    values: { ...baseValues },
    expect: 'success',
  });

  // ② Required fields empty
  for (const field of requiredFields.slice(0, 3)) {
    const values = { ...baseValues, [field.name]: '' };
    cases.push({
      id: `required-empty-${field.name}`,
      name: `Campo obligatorio vacío — ${field.label || field.name}`,
      description: `Deja "${field.label || field.name}" vacío y envía`,
      values,
      expect: 'validation-error',
    });
  }

  // ③ Invalid email
  if (emailField) {
    cases.push({
      id: 'email-invalid',
      name: 'Email con formato inválido',
      description: 'Introduce un email sin @ y envía',
      values: { ...baseValues, [emailField.name]: FAKE.emailInvalid },
      expect: 'validation-error',
    });

    // ④ Duplicate email
    cases.push({
      id: 'email-duplicate',
      name: 'Email duplicado',
      description: `Usa el email ${FAKE.emailDuplicate} que ya existe`,
      values: { ...baseValues, [emailField.name]: FAKE.emailDuplicate },
      expect: 'duplicate-or-error',
    });
  }

  // ⑤ XSS / special chars in first text field
  const textField = fields.find(f => f.type === 'text' && !f.name.toLowerCase().includes('email'));
  if (textField) {
    cases.push({
      id: 'special-chars',
      name: 'Caracteres especiales en campo texto',
      description: 'Introduce caracteres especiales y HTML en un campo texto',
      values: { ...baseValues, [textField.name]: '<b>Test</b> & "comillas" ñáéíóú' },
      expect: 'success-or-sanitized',
    });
  }

  return cases;
}

module.exports = { generateCases, FAKE };
