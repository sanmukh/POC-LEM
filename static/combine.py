import datetime
import os.path

# goes through files and fixes time and combines them2015-10-02 05:00:00
# names = ["load", "solar", "GT_load", "GT_solar"]
names = ["AMI_i"]
# good_ones = []
for num in range(20, 209):
    # good = True
    user = "user_" + str(num) + "_"
    if (not os.path.isfile("data/users/OCT_2-16/" + user + "AMI_i.csv")):
        continue

    if not os.path.exists("data/users/" + str(num)):
        os.makedirs("data/users/" + str(num))

    for name in names:
        t = datetime.datetime(2015, 10, 2, 5, 0);
        f = open("data/users/" + str(num) +  "/" + name + ".csv", "w")
        f.write('local_15min,grid\n')
        skip = False
        for tempfile in ["data/users/OCT_2-16/" + user + name + ".csv", "data/users/OCT_16-30/" + user + name +  ".csv"]:

            try:
                with open(tempfile) as g:
                    for line in g:
                        if (skip):
                            skip = False
                            continue
                        data = line.split(",")
                        if (data[0] == "local_15min"):
                            continue
                        if (len(data) > 1):
                            data = data[1]
                        else:
                            data = data[0]
                        f.write(t.strftime("%Y-%m-%d %X") + "," + data)
                        t += datetime.timedelta(minutes=15)
                skip = True
            except:
                # good = False
                break;
        f.close()
    # if (good):
    #     good_ones.append(num)

# print(good_ones)
# [20, 21, 24, 25, 26, 27, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 55, 56, 57, 58, 59, 60, 62, 63, 64, 65, 66, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 79, 80, 81, 82, 85, 86, 87, 89, 90, 91, 93, 94, 95, 96, 97, 98,
# 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 128, 129, 130, 131, 133, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 152, 153, 154, 155, 157,
# 158, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 176, 177, 178, 179, 180, 182, 183, 184, 185, 186, 187, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207]
