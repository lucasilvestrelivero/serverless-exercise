import { JwtToken } from './JwtToken';
import { sign } from 'jsonwebtoken';

export function generateToken(userId: string, secretKey: string): string {
    const expirationInSeconds =  60 * 120 //minutes you want
    const payload: JwtToken = {
        id: userId,
        expirationTime: expirationInSeconds,
        creationDate: new Date()
    }
    return sign(payload, secretKey, {
        expiresIn: expirationInSeconds,
        alg: 'HS512'
    });
}