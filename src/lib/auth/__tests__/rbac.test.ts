import { describe, it, expect } from 'vitest';
import { professor, coordenador, chefe, secretario } from '../permissions';

describe('RBAC Roles', () => {
  it('should have professor role with correct permissions', () => {
    // Check for study_plan permissions
    const perms = professor.statements.study_plan;
    expect(perms).toContain('create');
    expect(perms).toContain('submit');
    expect(perms).not.toContain('approve');
  });

  it('should have coordenador role with correct permissions', () => {
    const perms = coordenador.statements.study_plan;
    expect(perms).toContain('approve');
    expect(perms).toContain('reject');
    expect(perms).not.toContain('submit');
  });

  it('should have chefe role with all permissions', () => {
    const perms = chefe.statements.study_plan;
    expect(perms).toContain('view_all');
    expect(perms).toContain('approve');
  });

  it('should have secretario role with view_all and archive', () => {
    const perms = secretario.statements.study_plan;
    expect(perms).toContain('view_all');
    expect(perms).toContain('archive');
    expect(perms).not.toContain('create');
  });
});
