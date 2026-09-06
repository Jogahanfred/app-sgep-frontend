import type { GroundEvaluationRecord, SubphaseEntity } from '../entities/admin-catalog';
import { curriculumMissionRefs } from './admin-catalog';
import {
  applyGroundAssessmentGrade,
  academicCodeFromName,
  groundCourseRecords,
  type GroundSyllabusItem,
} from './ground-instruction-grade';

export interface SimulatorSyllabusItem {
  code: string;
  name: string;
  sheetCode: string;
}

export function simulatorSubphaseSyllabus(
  subphase: Pick<
    SubphaseEntity,
    'missionMode' | 'missionTypeIds' | 'customMissionNames' | 'autoMissionCode' | 'autoMissionCount'
  >,
  missionTypes: readonly { id: string; code: string; name: string }[],
): SimulatorSyllabusItem[] {
  return curriculumMissionRefs(subphase).map((ref) => {
    if (ref.kind === 'catalog') {
      const type = missionTypes.find((item) => item.id === ref.value);
      return {
        code: ref.key,
        name: type?.name ?? ref.value,
        sheetCode: type?.code ?? academicCodeFromName(String(ref.value)),
      };
    }
    return {
      code: ref.key,
      name: ref.value,
      sheetCode: academicCodeFromName(ref.value),
    };
  });
}

export function simulatorSessionRecords(
  existing: readonly GroundEvaluationRecord[],
  subphaseId: string,
  syllabus: readonly SimulatorSyllabusItem[],
): GroundEvaluationRecord[] {
  return groundCourseRecords(existing, subphaseId, toGroundSyllabus(syllabus));
}

export function applySimulatorMissionGrade(
  existing: readonly GroundEvaluationRecord[],
  subphaseId: string,
  syllabus: readonly SimulatorSyllabusItem[],
  code: string,
  grade: number,
): GroundEvaluationRecord[] {
  return applyGroundAssessmentGrade(existing, subphaseId, toGroundSyllabus(syllabus), code, grade);
}

function toGroundSyllabus(syllabus: readonly SimulatorSyllabusItem[]): GroundSyllabusItem[] {
  return syllabus.map((item) => ({ code: item.code, name: item.name, kind: 'exam' }));
}
