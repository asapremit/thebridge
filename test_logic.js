const ratings = { status: 0, career: 0, finance: 0 };
const selectedFocus = 'career';
const selectedStep2 = 'business';

let bottleneck = selectedFocus || 'status';
let lowestScore = ratings[bottleneck] || 0;

if (ratings.status > 0 || ratings.career > 0 || ratings.finance > 0) {
    bottleneck = 'status';
    lowestScore = ratings.status;
    if (ratings.career < lowestScore) {
        lowestScore = ratings.career;
        bottleneck = 'career';
    }
    if (ratings.finance < lowestScore) {
        lowestScore = ratings.finance;
        bottleneck = 'finance';
    }
}

const displayBottleneck = bottleneck === 'status' ? 'Immigration Status' : bottleneck === 'career' ? 'Career & Jobs' : 'Finance & Credit';
console.log("Bottleneck:", bottleneck);
console.log("Display:", displayBottleneck);
