#! /bin/bash

host="hackfest.ca"
reject="*.mp4,*.webp,*.css,*.png,*.svg"
outputDirectory=html

url="https://hackfest.ca/"
wget -rD $host -k -l1  --wait=0.1 --reject="$reject" --directory-prefix=$outputDirectory -- $url


host="hfctf.ca"
outputDirectory=html

url="https://hfctf.ca/"
wget -rD $host -k -l1 --wait=0.1 --reject="$reject" --directory-prefix=$outputDirectory -- $url


find html -type f -exec sed -i \
  -e 's#\(/cdn-cgi/l/email-protection\)#\1#g' \
  -e 's#\(/cdn-cgi/l/email-protection\)#\1#g' \
  -e 's#\(/cdn-cgi/l/email-protection\)[^"]*"#\1"#g' \
  -e 's#data-cfemail="[^"]*"#data-cfemail=""#g' \
  {} +
