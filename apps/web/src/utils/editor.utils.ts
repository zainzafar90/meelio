/*
|--------------------------------------------------------------------------
| Reading Time
|--------------------------------------------------------------------------
|
| These functions calculate the reading time of a given text. They are
| used to display the reading time of a post in the post preview.
|
| getReadingTime calculates the reading time of a given text and returns
| it as a string. getWordCount calculates the number of words in a given
| text and returns it as a number. getCharCount calculates the number of
| characters in a given text and returns it as a number.
|
*/
export const getReadingTime = (text: string) => {
  const wordsPerMinute = 200;
  const numberOfWords = text.split(/\s+/g).length - 1;
  const minutes = numberOfWords / wordsPerMinute;

  if (numberOfWords === 0) {
    return "0";
  }

  const readTime = Math.ceil(minutes);
  return `~ ${readTime}`;
};

/*
|--------------------------------------------------------------------------
| Word Count
|--------------------------------------------------------------------------
|
| These functions calculate the number of words and characters in a given
| text. They are used to display the word and character count of a post
| in the post preview.
|
*/
export const getWordCount = (text: string) => {
  if (!text) return 0;

  return text.trim().split(" ").length || 0;
};

/*
|--------------------------------------------------------------------------
| Character Count
|--------------------------------------------------------------------------
|
| These functions calculate the number of characters in a given text. They
| are used to display the character count of a post in the post preview.
|
*/
export const getCharCount = (text: string) => {
  if (!text) return 0;

  return text.trim().length || 0;
};
