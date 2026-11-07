import {
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';
import { describe, expect, it } from 'vitest';

import assigneeOnProjectTask from 'src/fields/assignee-on-project-task.field';
import assignedTrackerTasksOnWorkspaceMember from 'src/fields/assigned-tracker-tasks-on-workspace-member.field';
import companyOnMaintenanceContract from 'src/fields/company-on-maintenance-contract.field';
import companyOnProject from 'src/fields/company-on-project.field';
import maintenanceContractsOnCompany from 'src/fields/maintenance-contracts-on-company.field';
import maintenanceContractsOnProject from 'src/fields/maintenance-contracts-on-project.field';
import opportunityOnProject from 'src/fields/opportunity-on-project.field';
import ownedProjectsOnWorkspaceMember from 'src/fields/owned-projects-on-workspace-member.field';
import ownerOnProject from 'src/fields/owner-on-project.field';
import phaseOnProjectTask from 'src/fields/phase-on-project-task.field';
import phasesOnProject from 'src/fields/phases-on-project.field';
import projectOnMaintenanceContract from 'src/fields/project-on-maintenance-contract.field';
import projectOnProjectPhase from 'src/fields/project-on-project-phase.field';
import projectOnProjectTask from 'src/fields/project-on-project-task.field';
import projectsOnCompany from 'src/fields/projects-on-company.field';
import projectsOnOpportunity from 'src/fields/projects-on-opportunity.field';
import trackerTasksOnProject from 'src/fields/tracker-tasks-on-project.field';
import trackerTasksOnProjectPhase from 'src/fields/tracker-tasks-on-project-phase.field';
import maintenanceContract, {
  MAINTENANCE_CONTRACT_UNIVERSAL_IDENTIFIER,
} from 'src/objects/maintenance-contract.object';
import project, { PROJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/project.object';
import projectPhase, {
  PROJECT_PHASE_UNIVERSAL_IDENTIFIER,
} from 'src/objects/project-phase.object';
import projectTask, {
  PROJECT_TASK_UNIVERSAL_IDENTIFIER,
} from 'src/objects/project-task.object';

type ObjectDefinition = typeof project;

const fieldNamed = (definition: ObjectDefinition, name: string) => {
  const field = definition.config.fields?.find(
    (candidate) => candidate.name === name,
  );

  if (!field) {
    throw new Error(`Field ${name} not found`);
  }

  return field;
};

const optionPairs = (definition: ObjectDefinition, name: string) =>
  (fieldNamed(definition, name).options ?? []).map(({ value, label }) => [
    value,
    label,
  ]);

const typeOf = (definition: ObjectDefinition, name: string) =>
  fieldNamed(definition, name).type;

describe('Interfaze objects', () => {
  it.each([
    [project, 'project', 'projects', 'Projet', 'Projets'],
    [projectPhase, 'projectPhase', 'projectPhases', 'Phase', 'Phases'],
    [projectTask, 'projectTask', 'projectTasks', 'Tâche de suivi', 'Tâches de suivi'],
    [maintenanceContract, 'maintenanceContract', 'maintenanceContracts', 'Contrat de maintenance', 'Contrats de maintenance'],
  ])(
    'defines %#: names, labels and the name field as label identifier',
    (definition, nameSingular, namePlural, labelSingular, labelPlural) => {
      expect(definition.success).toBe(true);
      expect(definition.config).toMatchObject({
        nameSingular,
        namePlural,
        labelSingular,
        labelPlural,
      });
      expect(
        definition.config.labelIdentifierFieldMetadataUniversalIdentifier,
      ).toBe(fieldNamed(definition, 'name').universalIdentifier);
      expect(typeOf(definition, 'name')).toBe(FieldType.TEXT);
    },
  );

  it('defines the project fields', () => {
    expect(optionPairs(project, 'offer')).toEqual([
      ['WEB', 'WebFaze'],
      ['SHOP', 'ShopFaze'],
      ['APP', 'AppFaze'],
      ['SMART', 'SmartFaze'],
    ]);
    expect(optionPairs(project, 'status')).toEqual([
      ['IN_PROGRESS', 'En cours'],
      ['LAUNCHED', 'Mis en ligne'],
      ['ARCHIVED', 'Archivé'],
    ]);
    expect(fieldNamed(project, 'status').defaultValue).toBe("'IN_PROGRESS'");
    expect(typeOf(project, 'price')).toBe(FieldType.CURRENCY);
    expect(typeOf(project, 'announcedLaunchDate')).toBe(FieldType.DATE);
    expect(typeOf(project, 'launchedAt')).toBe(FieldType.DATE);
    expect(typeOf(project, 'progress')).toBe(FieldType.NUMBER);
    expect(typeOf(project, 'currentPhase')).toBe(FieldType.TEXT);
    expect(typeOf(project, 'trackerUrl')).toBe(FieldType.LINKS);
  });

  // Twenty gives every custom object a system position field; defining our own
  // is rejected by the server at install time.
  it.each([
    ['project', project],
    ['phase', projectPhase],
    ['tracker task', projectTask],
    ['maintenance contract', maintenanceContract],
  ])('leaves the %s ordering to the system position field', (_, definition) => {
    expect(
      definition.config.fields?.some((field) => field.name === 'position'),
    ).toBe(false);
  });

  it('defines the tracker task fields', () => {
    expect(optionPairs(projectTask, 'status')).toEqual([
      ['TODO', 'À faire'],
      ['DOING', 'En cours'],
      ['DONE', 'Fait'],
    ]);
    expect(fieldNamed(projectTask, 'status').defaultValue).toBe("'TODO'");
    expect(typeOf(projectTask, 'description')).toBe(FieldType.TEXT);
    expect(typeOf(projectTask, 'dueDate')).toBe(FieldType.DATE);
  });

  it('defines the maintenance contract fields', () => {
    expect(optionPairs(maintenanceContract, 'contractType')).toEqual([
      ['HOSTING', 'Hébergement'],
      ['MAINTENANCE', 'Maintenance'],
      ['HOSTING_AND_MAINTENANCE', 'Hébergement + maintenance'],
      ['EVOLUTIONS', 'Évolutions'],
    ]);
    expect(optionPairs(maintenanceContract, 'billingPeriod')).toEqual([
      ['MONTHLY', 'Mensuelle'],
      ['YEARLY', 'Annuelle'],
    ]);
    expect(optionPairs(maintenanceContract, 'status')).toEqual([
      ['ACTIVE', 'Actif'],
      ['TERMINATED', 'Résilié'],
    ]);
    expect(fieldNamed(maintenanceContract, 'status').defaultValue).toBe(
      "'ACTIVE'",
    );
    expect(typeOf(maintenanceContract, 'monthlyAmount')).toBe(
      FieldType.CURRENCY,
    );
    expect(typeOf(maintenanceContract, 'startDate')).toBe(FieldType.DATE);
    expect(typeOf(maintenanceContract, 'renewalDate')).toBe(FieldType.DATE);
  });

  it('remembers the renewal date a task was created for', () => {
    expect(
      fieldNamed(maintenanceContract, 'renewalTaskCreatedFor'),
    ).toMatchObject({
      type: FieldType.DATE,
      isNullable: true,
      isUIEditable: false,
    });
  });
});

const COMPANY = STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier;
const OPPORTUNITY =
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier;
const WORKSPACE_MEMBER =
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier;

type FieldDefinition = typeof companyOnProject;

const RELATIONS: [FieldDefinition, FieldDefinition, string, string, string, string, string, OnDeleteAction][] = [
  [companyOnProject, projectsOnCompany, PROJECT_UNIVERSAL_IDENTIFIER, COMPANY, 'company', 'projects', 'companyId', OnDeleteAction.SET_NULL],
  [opportunityOnProject, projectsOnOpportunity, PROJECT_UNIVERSAL_IDENTIFIER, OPPORTUNITY, 'opportunity', 'projects', 'opportunityId', OnDeleteAction.SET_NULL],
  [ownerOnProject, ownedProjectsOnWorkspaceMember, PROJECT_UNIVERSAL_IDENTIFIER, WORKSPACE_MEMBER, 'owner', 'ownedProjects', 'ownerId', OnDeleteAction.SET_NULL],
  [projectOnProjectPhase, phasesOnProject, PROJECT_PHASE_UNIVERSAL_IDENTIFIER, PROJECT_UNIVERSAL_IDENTIFIER, 'project', 'phases', 'projectId', OnDeleteAction.CASCADE],
  [phaseOnProjectTask, trackerTasksOnProjectPhase, PROJECT_TASK_UNIVERSAL_IDENTIFIER, PROJECT_PHASE_UNIVERSAL_IDENTIFIER, 'phase', 'trackerTasks', 'phaseId', OnDeleteAction.CASCADE],
  [projectOnProjectTask, trackerTasksOnProject, PROJECT_TASK_UNIVERSAL_IDENTIFIER, PROJECT_UNIVERSAL_IDENTIFIER, 'project', 'trackerTasks', 'projectId', OnDeleteAction.SET_NULL],
  [assigneeOnProjectTask, assignedTrackerTasksOnWorkspaceMember, PROJECT_TASK_UNIVERSAL_IDENTIFIER, WORKSPACE_MEMBER, 'assignee', 'assignedTrackerTasks', 'assigneeId', OnDeleteAction.SET_NULL],
  [companyOnMaintenanceContract, maintenanceContractsOnCompany, MAINTENANCE_CONTRACT_UNIVERSAL_IDENTIFIER, COMPANY, 'company', 'maintenanceContracts', 'companyId', OnDeleteAction.SET_NULL],
  [projectOnMaintenanceContract, maintenanceContractsOnProject, MAINTENANCE_CONTRACT_UNIVERSAL_IDENTIFIER, PROJECT_UNIVERSAL_IDENTIFIER, 'project', 'maintenanceContracts', 'projectId', OnDeleteAction.SET_NULL],
];

describe('Interfaze relations', () => {
  it.each(RELATIONS)(
    'links %#: both sides point at each other',
    (manyToOne, oneToMany, sourceObject, targetObject, name, inverseName, joinColumnName, onDelete) => {
      expect(manyToOne.success).toBe(true);
      expect(oneToMany.success).toBe(true);
      expect(manyToOne.config).toMatchObject({
        type: FieldType.RELATION,
        name,
        objectUniversalIdentifier: sourceObject,
        relationTargetObjectMetadataUniversalIdentifier: targetObject,
        relationTargetFieldMetadataUniversalIdentifier:
          oneToMany.config.universalIdentifier,
        universalSettings: {
          relationType: RelationType.MANY_TO_ONE,
          onDelete,
          joinColumnName,
        },
      });
      expect(oneToMany.config).toMatchObject({
        type: FieldType.RELATION,
        name: inverseName,
        objectUniversalIdentifier: targetObject,
        relationTargetObjectMetadataUniversalIdentifier: sourceObject,
        relationTargetFieldMetadataUniversalIdentifier:
          manyToOne.config.universalIdentifier,
        universalSettings: { relationType: RelationType.ONE_TO_MANY },
      });
    },
  );
});
