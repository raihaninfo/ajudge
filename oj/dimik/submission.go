package dimik

import (
	"encoding/json"
	"html"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/nahidhasan98/ajudge/db"
	"github.com/nahidhasan98/ajudge/discord"
	"github.com/nahidhasan98/ajudge/errorhandling"
	"github.com/nahidhasan98/ajudge/model"
	"go.mongodb.org/mongo-driver/bson"
)

//Submit function for submitting provlem solution to DimikOJ
func Submit(w http.ResponseWriter, r *http.Request, contestID int, serialIndex string) {
	defer errorhandling.Recovery() //for panic() error errorhandling.Recovery

	//getting form data
	OJ := r.FormValue("OJ")
	pNum := strings.TrimSpace(r.FormValue("pNum"))
	language := r.FormValue("language")
	source := strings.TrimSpace(r.FormValue("source"))

	//for submission first login to DimikOJ
	if Login() != "success" { //if login unsuccessful
		w.WriteHeader(http.StatusInternalServerError) //status code such as: 400, 404 etc.
		model.Info["StatusCode"] = http.StatusInternalServerError
		model.Tpl.ExecuteTemplate(w, "pageNotFound.gohtml", model.Info)
		return
	}
	//DimikOJ login success
	postData := url.Values{
		"_token":      {hiddenToken},
		"problem_id":  {pNum},
		"source_code": {source},
		"language_id": {language},
	}

	//submitting to DimikOJ
	apiURL := "https://dimikoj.com/submissions/" + pNum
	req, _ := http.NewRequest("POST", apiURL, strings.NewReader(postData.Encode()))
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
	req.Header.Add("Content-Length", strconv.Itoa(len(postData.Encode())))

	response, err := model.Client.Do(req)
	errorhandling.Check(err)
	defer response.Body.Close()
	//subbmission done

	//getting submission ID
	document, err := goquery.NewDocumentFromReader(response.Body)
	errorhandling.Check(err)

	subIDText := document.Find("h1[class='card-header']").Text()
	actualSubID := strings.TrimPrefix(subIDText, "সাবমিশন - ")
	//fmt.Println(185, subIDText, actualSubID)
	//got submission ID

	//getting language name against lang-value for inserting to DB
	language = model.LanguagePack[language]
	//fmt.Println(language)

	// inserting submission records to DB
	session, _ := model.Store.Get(r, "mysession")

	//connecting to DB
	DB, ctx, cancel := db.Connect()
	defer cancel()
	defer DB.Client().Disconnect(ctx)

	//taking DB collection/table to a variable
	submissionCollection := DB.Collection("submission")
	counterCollection := DB.Collection("counter")

	//getting data from DB
	var lastSubmissionID model.LastUsedID
	err = counterCollection.FindOne(ctx, bson.M{}).Decode(&lastSubmissionID)
	errorhandling.Check(err)

	currentTime := time.Now().Unix() //this is for DB insertion

	//formating currentTime time to display on frontend
	timeDotTime := time.Unix(currentTime, 0)
	submittedAt := timeDotTime.Format("02-Jan-2006 (15:04:05)")

	//preparing data for inserting to DB
	submissionData := model.SubmissionData{
		SubID:       lastSubmissionID.LastSubmissionID + 1,
		Username:    session.Values["username"].(string),
		OJ:          "DimikOJ",
		PNum:        pNum,
		Language:    language,
		SubmittedAt: currentTime,
		VID:         actualSubID,
		SourceCode:  source,
		Verdict:     "Queueing",
		ContestID:   contestID,
		SerialIndex: serialIndex,
	}
	_, err = submissionCollection.InsertOne(ctx, submissionData)
	errorhandling.Check(err)

	//updating LastSubmissionID to DB for later use/next submission
	updateField := bson.D{
		{Key: "$inc", Value: bson.D{
			{Key: "lastSubmissionID", Value: 1},
		}},
	}
	_, err = counterCollection.UpdateOne(ctx, bson.M{}, updateField)
	errorhandling.Check(err)

	//preparing data for response back
	respData := struct {
		SubID       int
		OJ          string
		PNum        string
		Language    string
		SourceCode  string
		SubmittedAt string
		ContestID   int
		SerialIndex string
		Error       string `json:"error"` //for vj submit error
	}{
		SubID:       submissionData.SubID, //sending submit id to frontend for getting the verdict with ajax call
		OJ:          OJ,
		PNum:        pNum,
		Language:    language,
		SourceCode:  html.EscapeString(source),
		SubmittedAt: submittedAt,
		ContestID:   contestID,
		SerialIndex: serialIndex,
		Error:       "",
	}
	w.Header().Set("Content-Type", "application/json")
	b, _ := json.Marshal(respData)
	w.Write(b)

	// notofy to discord
	discord := discord.Init()
	discord.SendMessage(submissionData, "submission")
}
