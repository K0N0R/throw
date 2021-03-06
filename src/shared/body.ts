export function isContact(evt: { bodyA: p2.Body, bodyB: p2.Body}, bodyA:p2.Body, bodyB: p2.Body): boolean {
    const bodies = [evt.bodyA, evt.bodyB];
    return bodies.indexOf(bodyA) !== -1 && bodies.indexOf(bodyB) !== -1;
}

export function isMoving(body: p2.Body): boolean {
    return Math.abs(body.velocity[0]) > 0.3 || Math.abs(body.velocity[1]) > 0.3;
}