const whiteList = [];

const ipSegs1 = ['192'];

const ipSegs2 = ['168'];

const ipSegs3 = ['50', '5'];

const ipSegs4 = ['181', '37', '239'];

const port = [':3000'];

ipSegs1.forEach((i1) => {
  ipSegs2.forEach((i2) => {
    ipSegs3.forEach((i3) => {
      ipSegs4.forEach((i4) => {
        port.forEach((p) => {
          whiteList.push(`http://${i1}.${i2}.${i3}.${i4}${port}`);
        });
      });
    });
  });
});

const other = ['http://localhost:3000'];


export default [...other, ...whiteList];
