export async function shareContent(data) {
  if (!navigator.share) {
    console.log('❌ Web Share API nije podržan');
    return false;
  }
  
  try {
    await navigator.share({
      title: data.title,
      text: data.text,
      url: data.url,
      files: data.files 
    });
    return true;
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('❌ Share greška:', error);
    }
    return false;
  }
}