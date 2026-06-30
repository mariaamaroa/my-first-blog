/**
 * Generates test cases dynamically from discovered fields.
 * No hardcoded field names — adapts to whatever the form has.
 */

const FAKE_DATA = {
  email: 'qa.test.auto@fideltour-qa.com',
  emailDuplicate: 'mamaroa@fideltour.com',
  emailInvalid: 'no-es-un-email',
  text: 'Test QA Automatizado',
  tel: '+34600000000',
  number: '42',
  date: '1990-06-15',
  select: null, // will pick first non-empty option
};

function valueForField(field, override = {}) {
  if (override[field.name] !== undefined) return override[field.name];
  if (field.type === 'select') {
    const opts = (field.options || []).filter(o => o.value && o.value !== '');
    return opts.length ? opts[0].value : null;
  }
  if (field.type === 'email') return FAKE_DATA.email;
  if (field.type === 'tel') return FAKE_DATA.tel;
  if (field.type === 'number') return FAKE_DATA.number;
  if (field.type === 'date') return FAKE_DATA.date;
  if (field.type === 'checkbox') return true;
  return FAKE_DATA.text;
}

function generateCases(fields) {
  const requiredFields = fields.filter(f => f.required);
  const emailField = fields.find(f => f.type === 'email' || f.name.toLowerCase().includes('email'));

  const cases = [];

  // ① Happy path — all valid data
  cases.push({
    id: 'happy-path',
    name: 'Happy path — datos válidos',
    description: 'Rellena todos los campos con datos correctos y guarda',
    values: Object.fromEntries(fields.map(f => [f.name, valueForField(f)])),
    expect: 'success',
  });

  // ② Required fields empty — one per required field
  for (const field of requiredFields) {
    const values = Object.fromEntries(fields.map(f => [f.name, valueForField(f)]));
    values[field.name] = '';
    cases.push({
      id: `required-empty-${field.name}`,
      name: `Campo obligatorio vacío — ${field.label || field.name}`,
      description: `Deja "${field.label || field.name}" vacío y envía`,
      values,
      expect: 'validation-error',
      targetField: field.name,
    });
  }

  // ③ Email invalid format
  if (emailField) {
    const values = Object.fromEntries(fields.map(f => [f.name, valueForField(f)]));
    values[emailField.name] = FAKE_DATA.emailInvalid;
    cases.push({
      id: 'email-invalid',
      name: 'Email con formato inválido',
      description: 'Introduce un email sin @ y envía',
      values,
      expect: 'validation-error',
      targetField: emailField.name,
    });
  }

  // ④ Duplicate email
  if (emailField) {
    const values = Object.fromEntries(fields.map(f => [f.name, valueForField(f)]));
    values[emailField.name] = FAKE_DATA.emailDuplicate;
    cases.push({
      id: 'email-duplicate',
      name: 'Email duplicado (ya existe en el sistema)',
      description: `Usa el email ${FAKE_DATA.emailDuplicate} que ya existe`,
      values,
      expect: 'duplicate-error',
      targetField: emailField.name,
    });
  }

  // ⑤ Max length exceeded
  const textFields = fields.filter(f => f.maxLength && f.type === 'text');
  for (const field of textFields.slice(0, 2)) {
    const values = Object.fromEntries(fields.map(f => [f.name, valueForField(f)]));
    values[field.name] = 'A'.repeat(field.maxLength + 10);
    cases.push({
      id: `max-length-${field.name}`,
      name: `Longitud máxima superada — ${field.label || field.name}`,
      description: `Introduce ${field.maxLength + 10} caracteres en un campo con max ${field.maxLength}`,
      values,
      expect: 'validation-error',
      targetField: field.name,
    });
  }

  // ⑥ Special characters
  if (emailField) {
    const values = Object.fromEntries(fields.map(f => [f.name, valueForField(f)]));
    const nameField = fields.find(f => f.name.toLowerCase().includes('name') || f.name.toLowerCase().includes('nombre'));
    if (nameField) {
      values[nameField.name] = '<script>alert("xss")</script>';
      cases.push({
        id: 'special-chars',
        name: 'Caracteres especiales / XSS en nombre',
        description: 'Introduce un payload XSS en el campo nombre',
        values,
        expect: 'sanitized-or-error',
        targetField: nameField.name,
      });
    }
  }

  return cases;
}

module.exports = { generateCases, FAKE_DATA };
