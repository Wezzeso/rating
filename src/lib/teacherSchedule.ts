export interface TeacherScheduleEntry {
    teacherName: string;
    disciplines: string[];
    groups: string[];
}

function normalizeText(value: string) {
    return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function getNameParts(value: string) {
    return normalizeText(value).split(/[ \-]/).filter(Boolean);
}

function uniqueValues(values: string[]) {
    return Array.from(
        new Map(
            values
                .map((value) => value.trim())
                .filter(Boolean)
                .map((value) => [normalizeText(value), value] as const)
        ).values()
    );
}

export function findMatchingTeacherEntries(
    professorName: string,
    teacherData: TeacherScheduleEntry[]
) {
    const normalizedProfessorName = normalizeText(professorName);
    const professorParts = getNameParts(professorName);

    const exactMatches = teacherData.filter(
        (teacher) => normalizeText(teacher.teacherName) === normalizedProfessorName
    );

    if (exactMatches.length > 0) {
        return exactMatches;
    }

    const overlapMatches = teacherData.filter((teacher) => {
        const teacherParts = getNameParts(teacher.teacherName);
        const sharedParts = teacherParts.filter((part) =>
            professorParts.includes(part)
        );

        return sharedParts.length >= 2;
    });

    if (overlapMatches.length > 0) {
        return overlapMatches;
    }

    return teacherData.filter((teacher) => {
        const normalizedTeacherName = normalizeText(teacher.teacherName);

        return (
            normalizedTeacherName.includes(normalizedProfessorName) ||
            normalizedProfessorName.includes(normalizedTeacherName)
        );
    });
}

export function getProfessorScheduleInfo(
    professorName: string,
    teacherData: TeacherScheduleEntry[]
) {
    const matches = findMatchingTeacherEntries(professorName, teacherData);

    return {
        disciplines: uniqueValues(
            matches.flatMap((teacher) => teacher.disciplines || [])
        ),
        groups: uniqueValues(matches.flatMap((teacher) => teacher.groups || [])),
    };
}
