using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Runtime.Remoting.Metadata.W3cXsd2001;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace TransformingData
{
    /**
     * Code to generate the JSON data heatmap file from the data model of MAPPPD
     * Store the site name and location, which location and then the penguin count from the years 1957 to 2017, with the transparency the marker should be drawn with.
     * When the transparency is 10, it means usually interpolated data
     * When the transparency is 0, it is the correct data
     * When the transparency is going from 100 to 10, we reported the value from the closest known year
     *
     * It is probably messy and quite difficult to read, specially because I changed my mind
     * in the middle of coding it multiple times.
     */
    class Program
    {
        static void Main(string[] args)
        {
            List<string> siteName = new List<string>();
            List<string> longitude = new List<string>();
            List<string> latitude = new List<string>();
            List<string> penguin = new List<string>();
            List<string> month = new List<string>();
            List<string> year = new List<string>();
            List<string> count = new List<string>();

            using (var reader = new StreamReader(@"D:\test.csv"))
            {
                while (!reader.EndOfStream)
                {
                    var line = reader.ReadLine();
                    var values = line.Split(';');

                    if(values[0].Equals("site_name"))
                        continue;

                    siteName.Add(values[0]);
                    longitude.Add(values[3]);
                    latitude.Add(values[4]);
                    penguin.Add(values[5]);
                    month.Add(values[7]);
                    year.Add(values[9]);
                    count.Add(values[10]);
                }
            }

            List<PenguinSite> sites = new List<PenguinSite>();

            string lastName ="";

            for (int i = 0; i < siteName.Count; i++)
            {
                if (!lastName.Equals(siteName.ElementAt(i)))
                {
                    PenguinSite penguinSite = new PenguinSite
                    {
                        SiteName = siteName.ElementAt(i),
                        Latitude = double.Parse(latitude.ElementAt(i), CultureInfo.InvariantCulture.NumberFormat),
                        Longitude = double.Parse(longitude.ElementAt(i), CultureInfo.InvariantCulture.NumberFormat)
                    };

                    penguinSite.Gentoo.Add(new List<PenguinCount>());
                    penguinSite.Adelie.Add(new List<PenguinCount>());
                    penguinSite.Chinstrap.Add(new List<PenguinCount>());
                    penguinSite.Emperor.Add(new List<PenguinCount>());

                    lastName = siteName.ElementAt(i);

                    sites.Add(penguinSite);
                }

                try
                {
                    PenguinCount penguinCount = new PenguinCount
                    {
                        Name = ConvertPenguinName(penguin.ElementAt(i)),
                        //month = Int32.Parse(month.ElementAt(i)),
                        Interpolated = false,
                        Count = Int32.Parse(count.ElementAt(i)),
                        Year = Int32.Parse(year.ElementAt(i)),
                        Opacity = 0
                    };

                    switch (penguinCount.Name)
                    {
                        case PenguinName.Adelie:
                            sites.Last().Adelie.ElementAt(0).Add(penguinCount);
                            break;
                        case PenguinName.Chinstrap:
                            sites.Last().Chinstrap.ElementAt(0).Add(penguinCount);
                            break;
                        case PenguinName.Emperor:
                            sites.Last().Emperor.ElementAt(0).Add(penguinCount);
                            break;
                        case PenguinName.Gentoo:
                            sites.Last().Gentoo.ElementAt(0).Add(penguinCount);
                            break;
                    }
                }
                catch (Exception)
                {

                }
            }


            using (var writer = new StreamWriter(@"D:\result.csv"))
            {
                const int minPenguins = 1;

                foreach (var penguinSite in sites)
                {
                    OptimizePenguinsCount(penguinSite.Gentoo);
                    OptimizePenguinsCount(penguinSite.Adelie);
                    OptimizePenguinsCount(penguinSite.Chinstrap);
                    OptimizePenguinsCount(penguinSite.Emperor);

                    if (penguinSite.Gentoo.Count >= minPenguins)
                    {
                        WritePenguinsData(writer, penguinSite, penguinSite.Gentoo, "Gentoo");
                    }

                    if (penguinSite.Adelie.Count >= minPenguins)
                    {
                        WritePenguinsData(writer, penguinSite, penguinSite.Adelie, "Adelie");
                    }

                    if (penguinSite.Chinstrap.Count >= minPenguins)
                    {
                        WritePenguinsData(writer, penguinSite, penguinSite.Chinstrap, "Chinstrap");
                    }

                    if (penguinSite.Emperor.Count >= minPenguins)
                    {
                        WritePenguinsData(writer, penguinSite, penguinSite.Emperor, "Emperor");
                    }
                }
            }

            List<JsonData> _data = new List<JsonData>();

            foreach (var site in sites)
            {
                if (site.Gentoo.Count >= 1)
                {
                    List<int> data = new List<int>();
                    List<int> transparency = new List<int>();

                    foreach (var penCount in site.Gentoo.ElementAt(0))
                    {
                        data.Add(penCount.Count);
                        transparency.Add(penCount.Opacity);
                    }

                    _data.Add(new JsonData()
                    {
                        SiteName = site.SiteName,
                        Penguin = "Gentoo",
                        Latitude = site.Latitude,
                        Longitude = site.Longitude,
                        Data = data,
                        Transparency = transparency
                    });
                }

                if (site.Adelie.Count >= 1)
                {
                    List<int> data = new List<int>();
                    List<int> transparency = new List<int>();

                    foreach (var penCount in site.Adelie.ElementAt(0))
                    {
                        data.Add(penCount.Count);
                        transparency.Add(penCount.Opacity);
                    }

                    _data.Add(new JsonData()
                    {
                        SiteName = site.SiteName,
                        Penguin = "Adélie",
                        Latitude = site.Latitude,
                        Longitude = site.Longitude,
                        Data = data,
                        Transparency = transparency
                    });
                }

                if (site.Chinstrap.Count >= 1)
                {
                    List<int> data = new List<int>();
                    List<int> transparency = new List<int>();

                    foreach (var penCount in site.Chinstrap.ElementAt(0))
                    {
                        data.Add(penCount.Count);
                        transparency.Add(penCount.Opacity);
                    }

                    _data.Add(new JsonData()
                    {
                        SiteName = site.SiteName,
                        Penguin = "Chinstrap",
                        Latitude = site.Latitude,
                        Longitude = site.Longitude,
                        Data = data,
                        Transparency = transparency
                    });
                }

                if (site.Emperor.Count >= 1)
                {
                    List<int> data = new List<int>();
                    List<int> transparency = new List<int>();

                    foreach (var penCount in site.Emperor.ElementAt(0))
                    {
                        data.Add(penCount.Count);
                        transparency.Add(penCount.Opacity);
                    }

                    _data.Add(new JsonData()
                    {
                        SiteName = site.SiteName,
                        Penguin = "Emperor",
                        Latitude = site.Latitude,
                        Longitude = site.Longitude,
                        Data = data,
                        Transparency = transparency
                    });
                }
            }

            string json = JsonConvert.SerializeObject(_data.ToArray());

            //write string to file
            System.IO.File.WriteAllText(@"D:\penguins_heatmap.json", json);
        }

        public static void OptimizePenguinsCount(List<List<PenguinCount>> countsP)
        {
            int year = 0;

            List<PenguinCount> counts = countsP.ElementAt(0);

            countsP.RemoveAt(0);

            // Remove duplicates years
            for(int i = 0; i < counts.Count; i++)
            {
                if (year == counts.ElementAt(i).Year)
                {
                    counts.ElementAt(i - 1).Count += counts.ElementAt(i).Count;
                    counts.ElementAt(i - 1).Count /= 2;
                    counts.RemoveAt(i);
                    i--;
                }
                else
                {
                    year = counts.ElementAt(i).Year;
                }
            }

            if (counts.Count == 0)
                return;

            year = counts.ElementAt(0).Year;

            List<PenguinCount> tempList = new List<PenguinCount>();

            // Split data
            for (int i = 0; i < counts.Count; i++)
            {

                if (year < counts.ElementAt(i).Year - 5)
                {
                    countsP.Add(tempList);
                    tempList = new List<PenguinCount>();
                }

                tempList.Add(counts.ElementAt(i));

                year = counts.ElementAt(i).Year;
            }

            countsP.Add(tempList);

            // Remove data too short
            for (int i = 0; i < countsP.Count; i++)
            {
                if (countsP.ElementAt(i).Count < 5)
                {
                    countsP.RemoveAt(i);
                    i--;
                }
            }


            // Interpolate
            foreach (var count in countsP)
            {
                year = count.ElementAt(0).Year;

                for (int i = 1; i < count.Count; i++)
                {
                    year++;

                    while (year < count.ElementAt(i).Year)
                    {
                        PenguinCount penCount = new PenguinCount
                        {
                            Count = (count.ElementAt(i).Count - count.ElementAt(i - 1).Count) /
                                    (count.ElementAt(i).Year - count.ElementAt(i - 1).Year) +
                                    count.ElementAt(i - 1).Count,
                            Year = year,
                            Opacity = 10,
                            Name = count.ElementAt(i).Name
                        };

                        count.Insert(i, penCount);
                        i++;

                        year++;
                    }
                }
            }

            // Regroup
            counts = new List<PenguinCount>();
            foreach (var count in countsP)
            {
                counts.AddRange(count);
            }


            if (counts.Count == 0)
                return;

            // Fill holes from 1957 to 2017
            year = 1957;

            int lastTrueIndex = 0;

            for (int i = 0; i < counts.Count; i++)
            {
                while (year < counts.ElementAt(i).Year)
                {
                    int opacity = 0;
                    int closestCount = 0;
                    int closestIndex = i;

                    if (i != 0)
                    {
                        // Find closest
                        closestIndex = Math.Abs(counts.ElementAt(i).Year - year) < Math.Abs(year - counts.ElementAt(lastTrueIndex).Year)
                            ? i
                            : lastTrueIndex;
                    }

                    opacity = Math.Min(Math.Abs(counts.ElementAt(closestIndex).Year - year) * 10, 100);
                    closestCount = counts.ElementAt(closestIndex).Count;

                    PenguinCount penCount = new PenguinCount
                    {
                        Count = closestCount,
                        Year = year,
                        Interpolated = true,
                        Name = counts.ElementAt(i).Name,
                        Opacity = opacity
                    };

                    counts.Insert(i, penCount);
                    i++;
                    lastTrueIndex++;

                    year++;
                }

                lastTrueIndex = i;
                year++;
            }

            while (year <= 2017)
            {
                int opacity = 0;
                int closestCount = 0;

                opacity = Math.Min((year - counts.Last().Year)  * 10, 100);
                closestCount = counts.Last().Count;

                PenguinCount penCount = new PenguinCount
                {
                    Count = closestCount,
                    Year = year,
                    Interpolated = true,
                    Name = counts.Last().Name,
                    Opacity = opacity
                };

                counts.Add(penCount);
                year++;
            }
            
            countsP.Clear();
            countsP.Add(counts);
            return;
        }

        public static void WritePenguinsData(StreamWriter writer, PenguinSite site, List<List<PenguinCount>> counts, string penguinName)
        {
            writer.Write(site.SiteName);
            writer.Write(";");
            writer.Write(site.Latitude);
            writer.Write(";");
            writer.Write(site.Longitude);
            writer.Write(";");
            writer.Write(penguinName);
            writer.Write(";");

            bool first = true;

            foreach (var listCount in counts)
            {
                if(!first)
                    writer.Write(";;;;");

                first = false;

                foreach (var count in listCount)
                {
                    writer.Write(count.Year);
                    writer.Write(";");
                }

                writer.WriteLine();
                
                writer.Write(";;;;");

                foreach (var count in listCount)
                {
                    writer.Write(count.Count);
                    writer.Write(";");
                }

                writer.WriteLine();

                writer.Write(";;;;");

                foreach (var count in listCount)
                {
                    writer.Write(count.Opacity);
                    writer.Write(";");
                }

                writer.WriteLine();
            }
        }

        public static PenguinName ConvertPenguinName(string name)
        {
            if (name.Equals("chinstrap penguin"))
                return PenguinName.Chinstrap;
            else if (name.Equals("gentoo penguin"))
                return PenguinName.Gentoo;
            else if (name.Equals("emperor penguin"))
                return PenguinName.Emperor;
            else
                return PenguinName.Adelie;
        }
    }


    enum PenguinName
    {
        Chinstrap, Adelie, Gentoo, Emperor
    }

    class PenguinCount
    {
        public PenguinName Name;
        public int Year;
        public int Count;
        public bool Interpolated;
        public int Opacity = 100;
    }

    class PenguinSite
    {
        public double Latitude;
        public double Longitude;
        public string SiteName;
        public List<List<PenguinCount>> Adelie = new List<List<PenguinCount>>();
        public List<List<PenguinCount>> Emperor = new List<List<PenguinCount>>();
        public List<List<PenguinCount>> Gentoo = new List<List<PenguinCount>>();
        public List<List<PenguinCount>> Chinstrap = new List<List<PenguinCount>>();
    }

    class JsonData
    {
        public string SiteName { get; set; }
        public string Penguin { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public List<int> Data { get; set; }
        public List<int> Transparency { get; set; }
    }
}
