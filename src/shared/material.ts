import * as p2 from 'p2';

export const mapMaterial = new p2.Material();
export const playerMaterial = new p2.Material();
export const ballMaterial = new p2.Material();
export const goalMaterial = new p2.Material();
export const contact = {
    mapPlayerContactMaterial: new p2.ContactMaterial(mapMaterial, playerMaterial, {
        friction: 1
    }),
    mapBallContactMaterial: new p2.ContactMaterial(mapMaterial, ballMaterial, {
        friction: 0,
        restitution: 0.5,
        stiffness: Number.MAX_VALUE
    }),
    goalBallContactMaterial: new p2.ContactMaterial(goalMaterial, ballMaterial, {
        friction: 5,
        restitution: 0,
    }),
    playerBallContactMaterial: new p2.ContactMaterial(playerMaterial, ballMaterial, {
        friction: 1
    })
}
