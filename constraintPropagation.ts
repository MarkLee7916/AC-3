// Defines a constraint satisfaction problem with binary constraints only
export interface CSP<T> {
    variables: Variable[]
    domains: Map<Variable, T[]>
    arcs: Arc<T>[]
}

// An ordered constraint between two variables
type Arc<T> = {
    relation: [Variable, Variable]
    constraint: (x: T, y: T) => boolean
}

type Variable = string;

// Simplify a csp by pruning redundant values from the domains of the variables
export function ac3<T>(csp: CSP<T>) {
    const arcQueue: Arc<T>[] = makeArcsSymmetric(csp.arcs);

    while (arcQueue.length > 0) {
        const arc = arcQueue.shift();
        const [prunedVariable] = arc.relation;

        if (revise(arc, csp)) {
            if (csp.domains.get(prunedVariable).length === 0) {
                return false;
            }

            arcsWithRespectTo(prunedVariable, csp).forEach(arc => {
                arcQueue.push(arc);
            })
        }
    }

    return true;
}

/*
The CSP passed in isn't assumed to have symmetric constraints 
For example, the csp having the constraint (a, b) => a > b doesn't imply it has the constraint (b, a) => b > a
This function takes in a csp and returns a csp with symmetric constraints 
*/
function makeArcsSymmetric<T>(arcsArg: Arc<T>[]) {
    const arcs = arcsArg.slice();

    arcs.forEach(arc => {
        const [prunedVariable, respectVariable] = arc.relation;

        arcs.push({
            relation: [respectVariable, prunedVariable],
            constraint: (x, y) => arc.constraint(y, x)
        });
    });

    return arcs;
}

// Returns the list of all arcs with relationship (x, variable)
function arcsWithRespectTo<T>(variable: Variable, csp: CSP<T>) {
    return csp.arcs.filter(({ relation }) => {
        const [_, respectVariable] = relation;

        return variable === respectVariable;
    });
}

// Given an arc with relation (p, r), prune any values from p's domain that can't satisfy the arcs constraints
export function revise<T>(arc: Arc<T>, csp: CSP<T>) {
    const [prunedVariable, respectVariable] = arc.relation;
    const prunedDomain = csp.domains.get(prunedVariable);
    const respectDomain = csp.domains.get(respectVariable);
    const valuesToRemove = new Set<T>();

    let revised = false;

    prunedDomain.forEach(pruneVal => {
        if (!respectDomain.find(respectVal => arc.constraint(pruneVal, respectVal))) {
            valuesToRemove.add(pruneVal);
            revised = true;
        }
    });

    pruneDomain(prunedDomain, valuesToRemove);

    return revised;
}

// Given a domain and a list of values to remove, remove the values by mutating
function pruneDomain<T>(domain: T[], valuesToRemove: Set<T>) {
    const domainCopy = domain.slice();

    domain.length = 0;

    domainCopy.forEach(val => {
        if (!valuesToRemove.has(val)) {
            domain.push(val);
        }
    });
}