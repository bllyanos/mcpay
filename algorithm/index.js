/**
 * MC Payment algorithm interview test.
 * @author Billy Editiano (bllyanos@gmail.com)
 */


/** 
 * return indices of the two numbers such that they add up to target 
 * @param nums {number[]} array of numbers
 * @param target {number} target number
 */
function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = 0; j < nums.length; j++) {
      if (i === j) continue; // skip same element

      if ((nums[i] + nums[j]) === target) {
        return [i, j];
      }
    }
  }

  throw new Error("Input have no solution.");
}

/** RUN Test cases */
function main() {

  // Test case 1
  const case1Nums = [2, 7, 11, 15];
  const case1Target = 13;
  const case1Expected = [0, 2];

  // Test case 2
  const case2Nums = [3, 2, 4];
  const case2Target = 6;
  const case2Expected = [1, 2];

  // Test case 3
  const case3Nums = [3, 3];
  const case3Target = 6;
  const case3Expected = [0, 1];


  // RUN case 1
  const case1Output = twoSum(case1Nums, case1Target);
  console.log("TEST CASE 1", compareArray(case1Output, case1Expected));

  // RUN case 2
  const case2Output = twoSum(case2Nums, case2Target);
  console.log("TEST CASE 2", compareArray(case2Output, case2Expected));

  // RUN case 3
  const case3Output = twoSum(case3Nums, case3Target);
  console.log("TEST CASE 3", compareArray(case3Output, case3Expected));
}

main();

/**
 * compare array by converting it to string
 * @param {any[]} array1 
 * @param {any[]} array2 
 * 
 * @returns {boolean} true if same element
 */
function compareArray(array1, array2) {
  return array1.toString() === array2.toString();
}